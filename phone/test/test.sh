#!/bin/bash

url=localhost:3000

# https://stackoverflow.com/a/19148720
curl -v -X PUT -F 'route=@rt-0.gpx' ${url}/route
# curl -v ${url}/route
curl -v -d "freq=500&rand=100&i=4" ${url}/test
# curl -v ${url}/test

# this is also interesting
# https://stackoverflow.com/a/11601341
