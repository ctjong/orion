module.exports = function(orion, chai, runner, name, config, mockConnectionPool)
{
    var orionApp;

    beforeEach(function(done)
    {
        runner.disableStdout();
        orionApp = new orion(config);
        orionApp.setupApiEndpoints();
        orionApp.getDatabaseAdapter().setConnectionPool(mockConnectionPool);
        orionApp.start(1337, function()
        {
            runner.enableStdout();
            done();
        });
        runner.startNewSession(orionApp, mockConnectionPool, null);
    });

    describe(name, function()
    {
        runner.runTest('POST | error-valid | 200', '/api/error', 'post', {'msg':'test error'}, "1", 200, null, [{"identity": "1"}]);
    });
};