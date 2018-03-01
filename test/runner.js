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
            pool.reset();
            var actualQueries = [];
            pool.onQueryReceived(function(actualString, actualParams, engine)
            {
                actualQueries.push({ string: actualString, params: actualParams, engine: engine });
                if(!!queryResults && !!queryResults.length)
                    pool.setQueryResults(queryResults.shift());
            });

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

        //TODO init mock storage provider
        //TODO orion.getStorageAdapter().setProvider(provider);

        startServerInternal(orion, 0, function()
        {
            isServerStarted = true;
            callback();
        });
    };


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

    this.runTest = runTest;
    this.startServer = startServer;
    _construct();
};

module.exports = Runner;
