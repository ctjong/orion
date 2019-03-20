#!/bin/bash
set -x #echo on

basepath="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

cd ${basepath}/core
npm ci
tsc --build tsconfig.json

cd ${basepath}/test/server
rm orion-api*.tgz
npm pack ../../core
mv orion-api*.tgz orion.tgz
npm ci

if [ "$1" == "-test" ]; then
    cd ${basepath}/test
    sudo docker-compose stop
    sudo docker-compose up
fi