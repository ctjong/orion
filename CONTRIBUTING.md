# Contributing Guide

- Any change to this repository must be made through pull requests
- All pull requests must be approved by the repository admin 
- Please mention which issue you are resolving with the pull request (you can type '#' and select the issue from the list). If the issue hasn't been created yet, please create one first and assign it to yourself.
- The code must be built successfully upon check in. You can build the code by running the build.sh script from the project root.
- All tests must pass. Please see the [Testing](#testing) section below for more details.
- Please merge the pull request using the **squash and merge** mode.

Please go to [Issues](https://github.com/ctjong/orion/issues) to see the list of all open issues. Thank you!


## Dev requirements

- [Typescript](https://www.typescriptlang.org/#download-links)
- [Docker](https://docs.docker.com/get-started/) 
- [Postman](https://www.getpostman.com/)


## Testing

We are using Postman and Docker to run the tests against our code. These tools are both very useful for testing API servers. If you don't have them already, please follow the set up instructions specified on the tool's websites. See [Dev requirements](#dev-requirements) section above for more details about the tools.

To run our tests, please follow these steps.
1. Launch Postman
2. Hit import
3. Select all postman files under the folder test/postman (those that have "postman" in its name) and hit Open.
4. Open command line, and run the build script from the project root and tell it to also set up the test servers.
```
MacOS / Linux:
$ ./build.sh -test
Windows:
$ build.bat /test
```
5. You can run the tests in Postman manually one-by-one, but make sure you run them in order from top to bottom so that the variables can be set properly. Or you can use Postman's collection runner that automatically runs all tests, by clicking the Runner button at the top. For both methods, you need to make sure that all tests pass for each environment (mssql-azure, mysql-s3, mysql-local).
