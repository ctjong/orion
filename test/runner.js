/**
 * Test runner class
 * @param {*} config Config module
 * @param {*} dbEngine Database engine
 * @param {*} storageProviderName Storage provider name
 */
var Runner = function(config, dbEngine, storageProviderName)
{
    var queries = require("./queries");
    var Orion = require('../index');
    var MockConnectionPool = require('./mocks/mockConnectionPool');
    var MockStorageProvider = require('./mocks/mockStorageProvider');
    var chai = require('chai');
    var chaiHttp = require('chai-http');
    var assert = require('assert');
    var fs = require('fs');
    var path = require('path');
    var jwt = require('jsonwebtoken');
    chai.use(chaiHttp);

    var _this = this;
    var activeLogFunction;
    var inactiveLogFunction;
    var orion = null;
    var pool = null;
    var storageProvider = null;

    var maxServerStartRetries = 10;

    _this.isServerStarted = false;

    //----------------------------------------------
    // CONSTRUCTOR
    //----------------------------------------------

    function _construct()
    {
        activeLogFunction = console.log;
        activeErrFunction = console.error;
        inactiveLogFunction = function() { };
        inactiveErrFunction = function() { };
    }

    //----------------------------------------------
    // PUBLIC
    //----------------------------------------------

    /**
     * Run a test
     * @param {*} name test name
     * @param {*} reqUrl request URL
     * @param {*} reqMethod request method
     * @param {*} reqBody request body
     * @param {*} accessToken access token
     * @param {*} expectedQueries list of expected query strings and parameters
     * @param {*} queryResults results to return for each query
     * @param {*} expectedResponseCode expected response status code
     * @param {*} expectedResponseBody expected response body
     */
    function runTest(name, reqUrl, reqMethod, reqBody, accessToken, 
        expectedQueries, queryResults, expectedResponseCode, expectedResponseBody)
    {
        it(name, function(done)
        {
            var actualQueries = [];
            onBeforeRequest(actualQueries, queryResults);

            var requestAwaiter;
            var request = chai.request(orion);
            if(reqMethod === "get")
                requestAwaiter = request.get(reqUrl);
            else if(reqMethod === "post")
                requestAwaiter = request.post(reqUrl).send(reqBody);
            else if(reqMethod === "put")
                requestAwaiter = request.put(reqUrl).send(reqBody);
            else if(reqMethod === "delete")
                requestAwaiter = request.delete(reqUrl);
            if(!!accessToken)
                requestAwaiter.set("Authorization", "Bearer " + accessToken);

            requestAwaiter.end(function(err, res)
            {
                onAfterRequest(actualQueries, res, expectedQueries, expectedResponseCode, expectedResponseBody);
                done();
            });
        });
    }

    /**
     * Run a file upload test
     * @param {*} name test name
     * @param {*} reqUrl request URL
     * @param {*} filePath path to the file to upload
     * @param {*} accessToken access token
     * @param {*} expectedMimeType expected MIME type of the uploaded file
     * @param {*} expectedQueries list of expected query strings and parameters
     * @param {*} queryResults results to return for each query
     * @param {*} expectedResponseCode expected response status code
     * @param {*} expectedResponseBody expected response body
     */
    function runFileUploadTest(name, reqUrl, filePath, accessToken, expectedMimeType, 
        expectedQueries, queryResults, expectedResponseCode, expectedResponseBody)
    {
        it(name, function(done)
        {
            var actualQueries = [];
            onBeforeRequest(actualQueries, queryResults);
            var inputFile = fs.readFileSync(filePath);
            var inputFileName = path.basename(filePath);
            var inputFileSize = fs.statSync(filePath).size;
            var uploadedFileName = null;
            var uploadedFileMime = null;
            storageProvider.onFilePartReceived(function(name, mime)
            {
                uploadedFileName = name;
                uploadedFileMime = mime;
            });

            var requestAwaiter = chai.request(orion)
                .post(reqUrl)
                .attach("file", inputFile, inputFileName);
            if(!!accessToken)
                requestAwaiter.set("Authorization", "Bearer " + accessToken);

            requestAwaiter.end(function(err, res)
            {
                try
                {
                    var uploadedFilePath = process.env.temp + "\\" + uploadedFileName;
                    var uploadedFile = fs.readFileSync(uploadedFilePath);
                    var uploadedFileSize = fs.statSync(uploadedFilePath).size;
                    if(uploadedFileMime !== null)
                        assert.equal(uploadedFileMime, expectedMimeType, "Uploaded file's MIME type is incorrect");
                    assert(uploadedFile.equals(inputFile), "Uploaded file is not the identical to input file");

                    for(var i=0; i<expectedQueries.length; i++)
                        for(var j=0; j<expectedQueries[i].params.length; j++)
                            if(expectedQueries[i].params[j] === 'uploadedName')
                                expectedQueries[i].params[j] = uploadedFileName;

                    onAfterRequest(actualQueries, res, expectedQueries, expectedResponseCode, expectedResponseBody);
                }catch(e){}
                done();
            });
        });
    }

    /**
     * Run a file delete test
     * @param {*} name test name
     * @param {*} reqUrl request URL
     * @param {*} accessToken access token
     * @param {*} expectedQueries list of expected query strings and parameters
     * @param {*} queryResults results to return for each query
     * @param {*} expectedResponseCode expected response status code
     * @param {*} expectedResponseBody expected response body
     */
    function runFileDeleteTest(name, reqUrl, accessToken, expectedQueries,
        queryResults, expectedResponseCode, expectedResponseBody)
    {
        it(name, function(done)
        {
            var actualQueries = [];
            var expectedFilename = queryResults[0][0].filename;
            onBeforeRequest(actualQueries, queryResults);
            var actualFilename = null;
            storageProvider.onFileDeleted(function(name)
            {
                actualFilename = name;
            });

            var requestAwaiter = chai.request(orion)
                .delete(reqUrl);
            if(!!accessToken)
                requestAwaiter.set("Authorization", "Bearer " + accessToken);

            requestAwaiter.end(function(err, res)
            {
                assert.equal(actualFilename, expectedFilename, "Deleted file name is incorrect");
                onAfterRequest(actualQueries, res, expectedQueries, expectedResponseCode, expectedResponseBody);
                done();
            });
        });
    }

    /** 
     * Start an Orion app
     * @param {*} callback Callback function
     */
    function startServer(callback)
    {
        if(_this.isServerStarted)
        {
            callback();
            return;
        }

        orion = new Orion(config);
        orion.setupApiEndpoints();

        pool = new MockConnectionPool(dbEngine);
        orion.getDatabaseAdapter().setConnectionPool(pool);

        storageProvider = new MockStorageProvider(storageProviderName);
        orion.getStorageAdapter().setProvider(storageProvider);

        startServerInternal(orion, 0, function()
        {
            isServerStarted = true;
            callback();
        });
    }

    //----------------------------------------------
    // PRIVATE
    //----------------------------------------------

    /**
     * Start an Orion app
     * @param {*} orion orion app
     * @param {*} numRetries number of retries so far
     * @param {*} callback callback function
     */
    function startServerInternal(orion, numRetries, callback)
    {
        if(numRetries > maxServerStartRetries)
            throw "Failed to start app. Max retries exceeded.";
        var port = 1337 + numRetries;
        orion.start(port, callback).on("error", function()
        {
            startServerInternal(orion, numRetries + 1, callback);
        });
    }

    /** 
     * To be invoked before firing a request
     * @param {*} actualQueries Actual queries received by DB adapter
     * @param {*} queryResults List of results to be returned for each incoming query
     */
    function onBeforeRequest(actualQueries, queryResults)
    {
        pool.reset();
        pool.onQueryReceived(function(actualString, actualParams, engine)
        {
            actualQueries.push({ string: actualString, params: actualParams, engine: engine });
            if(!!queryResults && !!queryResults.length)
                pool.setQueryResults(queryResults.shift());
        });
    }

    /**
     * To be invoked after the response to a request has been received
     * @param {*} actualQueries actual queries received by DB adapter
     * @param {*} actualResponse actual response received
     * @param {*} expectedQueries expected queries to be received
     * @param {*} expectedResponseCode expected response status code
     * @param {*} expectedResponseBody expected response body
     */
    function onAfterRequest(actualQueries, actualResponse, expectedQueries, expectedResponseCode, expectedResponseBody)
    {
        if(!!expectedQueries)
        {
            assert.equal(actualQueries.length, expectedQueries.length, "Number of received queries is not as expected");
            for(var i=0; i<expectedQueries.length; i++)
            {
                var actualString = actualQueries[i].string;
                var actualParams = actualQueries[i].params;
                var engine = actualQueries[i].engine;
                var expected = expectedQueries[i];
                var expectedString = queries[expected.name][engine];
                assetQueryString(actualString.trim().toLowerCase(), expectedString.trim().toLowerCase());
                for(var j=0; j<expected.params.length; j++)
                {
                    if(expected.params[i] === "skip")
                        continue;
                    var actualValue = engine === "mssql" ? actualParams["value" + j][1] : actualParams[j];
                    assert.equal(actualValue, expected.params[j], "Incorrect query parameter at index " + j + ". Actual: " + actualValue + ". Expected: " + expected.params[i]);
                }
            }
        }

        assert.equal(actualResponse.status, expectedResponseCode, "Status code " + actualResponse.status + " is not expected");
        var responseBody = Object.keys(actualResponse.body).length > 0 ? actualResponse.body : actualResponse.text;
        if(!!expectedResponseBody)
            assertResponseBody(responseBody, expectedResponseBody, "", "");
    }

    /**
     * Assert that a response body match the expected
     * @param {*} actual Actual response body
     * @param {*} expected Expected response body
     * @param {*} relativePath Path to the current value from object root
     * @param {*} currentKey Current object key
     */
    function assertResponseBody(actual, expected, relativePath, currentKey)
    {
        var fullPath = relativePath + "/" + currentKey;
        if(typeof actual === "undefined" || actual == null)
            assert.fail("Missing response body at " + fullPath);
        if(currentKey === "token")
        {
            try
            {
                actual = jwt.verify(actual, "samplestring");
            }
            catch(e)
            {
                assert.fail("Failed to decode token at " + fullPath + ".");
            }
        }
        if(typeof expected === "object")
        {
            for(var key in expected)
            {
                if(!expected.hasOwnProperty(key))
                    continue;
                var childExpected = expected[key];
                var childActual = actual[key];
                if(!actual)
                    assert.fail("Response body with key " + fullPath + "/" + key + " doesn't exist");
                assertResponseBody(childActual, childExpected, fullPath, key);
            }
        }
        else
        {
            assert.equal(actual, expected, "Incorrect response body value at " + fullPath + ". Actual: " + actual + ". Expected: " + expected);
        }
    }

    /**
     * Assert that a query string match the expected
     * @param {*} actual Actual query string
     * @param {*} expected Expected query string
     */
    function assetQueryString(actual, expected)
    {
        if(expected.indexOf("select") === 0)
        {
            assertQueryClause(actual, expected, "select", "from", ",");
            assertQueryClause(actual, expected, "from", "where", "innerjoin");
            var actualEnd = actual.substring(actual.indexOf("where"));
            var expectedEnd = expected.substring(expected.indexOf("where"));
            assert.equal(actualEnd, expectedEnd, "End of query string is not as expected");
        }
        else
        {
            assert.equal(actual, expected, "Query string does not match the expected");
        }
    }

    /**
     * Assert that a query clause matches the expected
     * @param {*} actual actual query string
     * @param {*} expected expected query string
     * @param {*} clauseStart start keyword of the query clause
     * @param {*} clauseEnd start keyword of the query clause
     * @param {*} separator separator string between each clause value
     */
    function assertQueryClause(actual, expected, clauseStart, clauseEnd, separator)
    {
        var actualValues = getQueryClauseValues(actual, clauseStart, clauseEnd, separator);
        var expectedValues = getQueryClauseValues(expected, clauseStart, clauseEnd, separator);
        if(actualValues.length !== expectedValues.length)
            return false;
        actualValues.forEach(function(actualItem, index)
        {
            if(actualItem !== expectedValues[index])
            {
                assert.fail("Query clause is not as expected. Actual: [" + actualValues.join(",") + "]. Expected: [" + expectedValues.join(",") + "].");
            }
        });
    }

    /**
     * Get array of values from a query clause
     * @param {*} query query string
     * @param {*} clauseStart start keyword of the query clause
     * @param {*} clauseEnd start keyword of the query clause
     * @param {*} separator separator string between each clause value
     * @return array of values
     */
    function getQueryClauseValues(query, clauseStart, clauseEnd, separator)
    {
        var clauseStartIndex = query.indexOf(clauseStart);
        if(clauseStartIndex < 0)
            return "";
        else if(clauseStartIndex === 0) 
            clauseStart += " ";
        else
            clauseStart = " " + clauseStart + " ";
        var clauseBegin = query.indexOf(clauseStart) + clauseStart.length;
        var clause;
        if(!clauseEnd)
        {
            clause = query.substring(clauseBegin);
        }
        else
        {
            clauseEnd = " " + clauseEnd + " ";
            clause = query.substring(clauseBegin, query.indexOf(clauseEnd));
        }
        var values = clause.split(" ").join("").split(separator);
        values.sort();
        return values;
    }

    this.runTest = runTest;
    this.runFileUploadTest = runFileUploadTest;
    this.runFileDeleteTest = runFileDeleteTest;
    this.startServer = startServer;
    _construct();
};

module.exports = Runner;
