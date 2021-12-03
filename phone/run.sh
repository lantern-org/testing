#!/bin/bash

pre=test_
network=testing_default
docker network create --driver bridge $network
phone_tag=phone-emulator
(
    docker build --tag $phone_tag . && \
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
