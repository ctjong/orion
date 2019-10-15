#!/bin/bash
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
        docker-compose -H $1 stop
        docker-compose -H $1 up
    else
        docker-compose stop
        docker-compose up
    fi
fi