@echo off

echo set basepath=%~dp0
call set basepath=%~dp0

echo cd %basepath%\core
call cd %basepath%\core
echo npm ci
call npm ci
echo tsc --build tsconfig.json
call tsc --build tsconfig.json

echo cd %basepath%\test\server
call cd %basepath%\test\server
echo del /S /Q orion-api*.tgz
call del /S /Q orion-api*.tgz
echo npm pack ..\..\core
call npm pack ..\..\core
echo move orion-api*.tgz orion.tgz
call move orion-api*.tgz orion.tgz
echo npm ci
call npm ci

if "%1" == "/test" (
    echo cd %basepath%/test
    call cd %basepath%/test
    echo docker-compose stop
    call docker-compose stop
    echo docker-compose up
    call docker-compose up
)

echo cd %basepath%
call cd %basepath%