module.exports = function(orion, chai, name, config, mockConnectionPool)
{
    describe(name, function()
    {
        beforeEach(function(done)
        {
            mockConnectionPool.reset();
            done();
        });
    
        describe('Server start', function()
        {
            it('it should succeed', function(done)
            {
                var app = new orion(config);
                app.setupApiEndpoints();
                app.getDatabaseAdapter().setConnectionPool(mockConnectionPool);
                app.start(1337, done);
            });
        });

        describe('POST | error-valid | 200', function()
        {
            it('it should succeed', function(done)
            {
                mockConnectionPool.setQueryResults({"success": "1"});
                chai.request(server)
                    .post('/api/error')
                    .body("{'msg':'test error'}")
                    .end(function(err, res)
                    {
                        res.should.have.status(200);
                        done();
                    });
            });
        });
    
    });
};