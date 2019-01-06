#!/bin/bash
set -x #echo on

basepath="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

cd ${basepath}/core
npm install
tsc --build tsconfig.json

cd ${basepath}/test/server
npm install
npm pack ../../core
npm install --save orion*.tgz

if [ "$1" == "-test" ]; then
    cd ${basepath}/test
    docker-compose stop
    docker-compose up
fi