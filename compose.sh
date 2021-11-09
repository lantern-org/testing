# so we're going to ignore docker compose
# in favor of just doing it ourselves
# this is mainly because i can't figure out
# how to get a new container to show up in a composed stack
# this should make sense though, since the compose
# file should exactly represent the created containers
pre=test_

# make network
network=testing_default
docker network create --driver bridge $network

# make ingest server
udp=60001-60100 # support a max of 100 active UDP connections (for now)
(
    ingest=$(MSYS_NO_PATHCONV=1 \
        docker container create \
            --network $network \
            --publish 1025:1025/tcp \
            --expose  1025/tcp \
            --expose  $udp/udp \
            --name    ${pre}ingest-server \
            --volume  $PWD/ingest-server-config:/config \
        ghcr.io/lantern-org/ingest-server \
            --api-port=1025 \
            --udp-ports=$udp \
            --user-file=/config/database.json) && \
    docker container start $ingest
) &

# make redis for frontend
redis=${pre}redis
(
    docker run \
        --network $network \
        --publish 6379:6379 \
        --name $redis \
        --detach \
        redis redis-server
) &
REDIS_URL=redis://${redis}:6379

# make sidekiq for frontend (same image container as frontend)
# JOB_WORKER_URL ?
frontend_tag=frontend
docker build --quiet --tag $frontend_tag ./frontend
(
    sidekiq=$(MSYS_NO_PATHCONV=1 \
        docker container create \
            --network $network \
            --env     REDIS_URL=$REDIS_URL \
            --name    ${pre}sidekiq \
            --volume  $PWD/frontend:/app \
            --volume  //var/run/docker.sock:/var/run/docker.sock:rw \
            $frontend_tag \
            bundle exec sidekiq) && \
    docker container start $sidekiq
) &

# make frontend
(
    frontend=$(MSYS_NO_PATHCONV=1 \
        docker container create \
            --network $network \
            --env     REDIS_URL=$REDIS_URL \
            --env     RAILS_ENV=development \
            --publish 80:3000/tcp \
            --name    ${pre}frontend \
            --volume  $PWD/frontend:/app \
            --volume  //var/run/docker.sock:/var/run/docker.sock:rw \
            $frontend_tag) && \
    docker container start $frontend
) &

# make first phone emulator
phone_tag=phone-emulator
(
    docker build --quiet --tag $phone_tag ./phone && \
    phone=$(MSYS_NO_PATHCONV=1 \
        docker container create \
            --network $network \
            --publish 3000:3000 \
            --name    ${pre}phone-emulator_0 \
            $phone_tag) && \
    docker container start $phone
) &

# wait to stop
wait # for & jobs
read -p "running... [stop]"

# clean-up
all=$(docker container ls -q --all --filter name=${pre}*)
docker container stop --time 3 $all
docker container rm $all
docker network rm $network
