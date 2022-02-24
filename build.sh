#!/bin/bash

docker pull ghcr.io/lantern-org/ingest-server

docker pull redis:6.2.6-alpine

frontend_tag=frontend
docker build --quiet --tag $frontend_tag ./frontend

phone_tag=phone-emulator
docker build --quiet --tag $phone_tag ./phone
