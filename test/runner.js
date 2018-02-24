var runner = function(chai)
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
        inactiveLogFunction = function() { };
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
     * @param {*} expectedStatus expected response status
     * @param {*} additionalCheck additional check to execute. signarture = fn(err, res, done).
     * @param {*} queryResults query results to be returned by connection pool
     * @param {*} queryFunction query function to be executed before DB request is fired
     * @param {*} connectSuccess whether or not connect request should succeed
     */
    function runTest(name, reqUrl, reqMethod, reqBody, accessToken, expectedStatus, 
        additionalCheck, queryResults, queryFunction, connectSuccess)
    {
        it(name, function(done)
        {
            disableStdout();
            pool.reset();
            if(!!queryResults)
                pool.setQueryResults(queryResults);
            if(!!queryFunction)
                pool.setQueryFunction(queryFunction);
            if(typeof connectSuccess !== "undefined")
                pool.setConnectSuccess(connectSuccess);

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
                res.should.have.status(expectedStatus);
                if(!!additionalCheck)
                    additionalCheck(err, res, function(){ endSuppress(done); });
                else
                enableStdout();
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
    }

    /**
     * Disable stdout
     */
    function disableStdout()
    {
        console.log = inactiveLogFunction;
    }

    this.startNewSession = startNewSession;
    this.runTest = runTest;
    this.enableStdout = enableStdout;
    this.disableStdout = disableStdout;
    _construct();
};

module.exports = runner;
