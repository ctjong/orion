var queries = require("./queries");

var runner = function(chai, assert)
{
    var activeLogFunction;
    var inactiveLogFunction;

    var orionApp;
    var pool;
    var storageProvider;

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
     * Start a new testing session
     * @param {*} orionAppArg Orion application object
     * @param {*} poolArg Connection pool object
     * @param {*} storageProviderArg Storage provider object
     */
    function startNewSession(orionAppArg, poolArg, storageProviderArg)
    {
        orionApp = orionAppArg;
        pool = poolArg;
        storageProvider = storageProviderArg;
    }

    /**
     * Run a test
     * @param {*} name test name
     * @param {*} reqUrl request URL
     * @param {*} reqMethod request method
     * @param {*} reqBody request body
     * @param {*} accessToken access token
     * @param {*} expectedStatusCodes expected response status codes
     * @param {*} expectedQueries list of expected query strings and parameters
     * @param {*} querySuccess whether or not query request should succeed
     * @param {*} connectSuccess whether or not connect request should succeed
     */
    function runTest(name, reqUrl, reqMethod, reqBody, accessToken, expectedStatusCodes, 
        expectedQueries, querySuccess, connectSuccess)
    {
        it(name, function(done)
        {
            pool.reset();
            if(typeof querySuccess !== "undefined")
                pool.setQuerySuccess(querySuccess);
            if(typeof connectSuccess !== "undefined")
                pool.setConnectSuccess(connectSuccess);

            if(!!expectedQueries)
            {
                pool.onQueryReceived(function(actualString, actualParams, engine)
                {
                    var expected = expectedQueries.shift();
                    var expectedString = queries[expected.name][engine];
                    assert.equal(actualString, expectedString, "Query string does not match the expected");
                    for(var i=0; i<expected.params.length; i++)
                    {
                        if(expected.params[i] === "skip")
                            continue;
                        var actualValue = engine === "mssql" ? actualParams["value" + i] : actualParams[i];
                        assert.equal(actualValue, expected.params[i], "Query parameter at index " + i + " does not match the expected");
                    }
                });
            }

            var requestAwaiter;
            var request = chai.request(orionApp.app);
            if(reqMethod === "get")
                requestAwaiter = request.get(reqUrl);
            if(reqMethod === "post")
                requestAwaiter = request.post(reqUrl).send(reqBody);
            if(reqMethod === "put")
                requestAwaiter = request.put(reqUrl).send(reqBody);
            if(reqMethod === "delete")
                requestAwaiter = request.delete(reqUrl);
            if(!!accessToken)
                requestAwaiter.set("Authorization", "Bearer " + accessToken);

            requestAwaiter.end(function(err, res)
            {
                assert(expectedStatusCodes.indexOf(res.status) >= 0, "Status code " + res.status + " is not expected");
                assert(!expectedQueries || expectedQueries.length === 0, "Not all expected queries were received");
                done();
            });
        });
    }

    /**
     * Enable stdout
     * @param {*} fn function to execute
     */
    function enableStdout()
    {
        console.log = activeLogFunction;
        console.error = activeErrFunction;
    }

    /**
     * Disable stdout
     */
    function disableConsole()
    {
        console.log = inactiveLogFunction;
        console.error = inactiveErrFunction;
    }

    this.startNewSession = startNewSession;
    this.runTest = runTest;
    this.enableStdout = enableStdout;
    this.disableConsole = disableConsole;
    _construct();
};

module.exports = runner;
