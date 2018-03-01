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
    var crypto = require('crypto');
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
     * @param {*} expectedStatusCodes expected response status codes
     * @param {*} expectedQueries list of expected query strings and parameters
     * @param {*} queryResults results to return for each query
     */
    function runTest(name, reqUrl, reqMethod, reqBody, accessToken, expectedStatusCodes, 
        expectedQueries, queryResults)
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
                onAfterRequest(actualQueries, expectedQueries, expectedStatusCodes);
                done();
            });
        });
    }

    /**
     * Run an upload test
     * @param {*} name test name
     * @param {*} filePath path to the file to upload
     * @param {*} accessToken access token
     * @param {*} expectedMimeType expected MIME type of the uploaded file
     * @param {*} expectedStatusCodes expected response status codes
     * @param {*} expectedQueries list of expected query strings and parameters
     * @param {*} queryResults results to return for each query
     */
    function runUploadTest(name, filePath, accessToken, expectedMimeType, expectedStatusCodes, expectedQueries, queryResults)
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
            storageProvider.onFileReceived(function(name, stream, size, mime)
            {
                uploadedFileName = name;
                uploadedFileMime = mime;
            });

            var requestAwaiter = chai.request(orion)
                .post("/api/data/asset")
                .attach("file", inputFile, inputFileName);
            if(!!accessToken)
                requestAwaiter.set("Authorization", "Bearer " + accessToken);

            requestAwaiter.end(function(err, res)
            {
                var uploadedFilePath = process.env.temp + "\\" + uploadedFileName;
                var uploadedFile = fs.readFileSync(uploadedFilePath);
                var uploadedFileSize = fs.statSync(uploadedFilePath).size;
                assert.equal(uploadedFile, inputFile, "Uploaded file content is incorrect");
                assert.equal(uploadedFileMime, expectedMimeType, "Uploaded file's MIME type is incorrect");
                assert.equal(uploadedFileSize, inputFileSize, "Uploaded file's size is incorrect");

                for(var i=0; i<expectedQueries.length; i++)
                    for(var j=0; j<expectedQueries[i].params.length; j++)
                        if(expectedQueries[i].params[j] === 'uploadedName')
                            expectedQueries[i].params[j] = uploadedFileName;

                onAfterRequest(actualQueries, expectedQueries, expectedStatusCodes);
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
     * @param {*} actualQueries Actual queries received by DB adapter
     * @param {*} expectedQueries Expected queries to be received
     * @param {*} expectedStatusCodes Expected response codes
     */
    function onAfterRequest(actualQueries, expectedQueries, expectedStatusCodes)
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
                assert.equal(actualString.trim().toLowerCase(), expectedString.trim().toLowerCase(), "Query string does not match the expected");
                for(var j=0; j<expected.params.length; j++)
                {
                    if(expected.params[i] === "skip")
                        continue;
                    var actualValue = engine === "mssql" ? actualParams["value" + j] : actualParams[j];
                    assert.equal(actualValue, expected.params[j], "Query parameter at index " + j + " does not match the expected");
                }
            }
        }

        assert(expectedStatusCodes.indexOf(res.status) >= 0, "Status code " + res.status + " is not expected");
    }

    this.runTest = runTest;
    this.runUploadTest = runUploadTest;
    this.startServer = startServer;
    _construct();
};

module.exports = Runner;
