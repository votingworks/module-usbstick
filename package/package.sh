#!/bin/bash

echo "packaging application"

tar --exclude=.git \
    --exclude=.github \
    --exclude=.DS_Store \
    --exclude=.circleci \
    --exclude=.postman \
    --exclude=node_modules \
    --exclude=package \
    --exclude=.dockerignore \
    --exclude=.gitignore \
    --exclude=Dockerfile \
    --exclude=Makefile \
    -zcvf module-usb.tar.gz module-usb.service ../

echo "packaging complete"
