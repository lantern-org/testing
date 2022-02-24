#!/bin/bash

pre=test_
network=testing_default
all=$(docker container ls -q --all --filter name=${pre}*)
docker container stop --time 3 $all
docker container rm $all
docker network rm $network
docker volume prune # TODO -- make this remove all volumes created at the start of this script
