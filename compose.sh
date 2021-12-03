#!/bin/bash

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
# docker pull ghcr.io/lantern-org/ingest-server
# you might have to change these UDP ports to whatever your system can use
udp=60001-60030 # support a max of 100 active UDP connections (for now)
api=1025
INGEST_URL=${pre}ingest-server
# --expose  $api/tcp \
# --expose  $udp/udp \
(
    ingest=$(MSYS_NO_PATHCONV=1 \
        docker container create \
            --network $network \
            --publish $api:$api/tcp \
            --publish $udp:$udp/udp \
            --name    $INGEST_URL \
            --volume  "$PWD"/ingest-server-config:/config \
        ghcr.io/lantern-org/ingest-server \
            --api-port=$api \
            --udp-addr='' \
            --udp-ports=$udp \
            --user-file=/config/database.json) && \
    docker container start $ingest
) &
# INGEST_PORT=$api

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
            --volume  "$PWD"/frontend:/app \
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
            --env     INGEST_URL=$INGEST_URL \
            --env     INGEST_PORT=$api \
            --publish 80:3000/tcp \
            --name    ${pre}frontend \
            --volume  "$PWD"/frontend:/app \
            --volume  //var/run/docker.sock:/var/run/docker.sock:rw \
            $frontend_tag) && \
    docker container start $frontend
) &

# make first phone emulator
phone_tag=phone-emulator
# --expose  $udp/udp \
(
    docker build --quiet --tag $phone_tag ./phone && \
    phone=$(MSYS_NO_PATHCONV=1 \
        docker container create \
            --network $network \
            --env     INGEST_URL=$INGEST_URL \
            --env     INGEST_PORT=$api \
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
docker volume prune # TODO -- make this remove all volumes created at the start of this script
