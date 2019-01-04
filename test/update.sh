#!/bin/bash

cd server
npm install
cd ../client
npm install
cd ../../core
tsc --build tsconfig.json
cd ../test/server
npm pack ../../core
npm install --save orion*.tgz