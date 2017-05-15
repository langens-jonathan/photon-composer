#!/bin/bash

# this script npm installs, prepares the photon folder
# goes in it and launches the application

npm install

node prepare-docker-compose.js

cd photon

docker-compose up
