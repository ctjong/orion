#!/bin/bash

if [ "$1" == "--help" ]; then
    echo "Usage: build.sh [-testserver] [docker_host]"
    exit 0
fi


set -x #echo on

basepath="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

cd ${basepath}/core
tsc --build tsconfig.json
npm install

if [ "$1" == "-testserver" ]; then
    cd ${basepath}/test/server
    rm orion-api*.tgz
    npm pack ../../core
    mv orion-api*.tgz orion.tgz

    cd ${basepath}/test
    if [ "$2" != "" ]; then
        docker-compose -H $2 stop
        docker-compose -H $2 up
    else
        docker-compose stop
        docker-compose up
    fi
fi