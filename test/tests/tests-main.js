module.exports = function(Orion, chai, runner, name, config, mockConnectionPool)
{
    var orion;

    beforeEach(function(done)
    {
        if(!!orion)
        {
            done();
            return;
        }

        orion = new Orion(config);
        orion.setupApiEndpoints();
        orion.getDatabaseAdapter().setConnectionPool(mockConnectionPool);
        orion.start(1337, done);
        runner.startNewSession(orion, mockConnectionPool, null);
    });

    describe(name, function()
    {
        var params = 
        {
            // { id: "1", domain: "local", domainId: null, roles: "member" }
            user1Token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJkb21haW4iOiJsb2NhbCIsImRvbWFpbklkIjpudWxsLCJyb2xlcyI6Im1lbWJlciIsImlhdCI6MTUxOTQ1OTYyOH0.MWjNP36TRnrBTmtDQqLN3tWRn06eASEu7Z4_7ocYrcU",
            // { id: "2", domain: "local", domainId: null, roles: "member" }
            user2Token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjIiLCJkb21haW4iOiJsb2NhbCIsImRvbWFpbklkIjpudWxsLCJyb2xlcyI6Im1lbWJlciIsImlhdCI6MTUxOTQ1OTYxNH0.MnZ6M-ebkIvomy-Ls1ICgYctQecO9xwqA1ggiqI5b2k",
            // { id: "3", domain: "local", domainId: null, roles: "member" }
            user3Token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjMiLCJkb21haW4iOiJsb2NhbCIsImRvbWFpbklkIjpudWxsLCJyb2xlcyI6Im1lbWJlciIsImlhdCI6MTUxOTQ1OTU5MX0.1-sM6LWj3m51LAi_c3QRaCSooIo21NiWv0POw-wrHDg"
        };

        runner.runTest(
            'POST | error-valid | 200',
            '/api/error',
            'post',
            {"msg":"test error"},
            null,
            [200],
            [{"name":"insertError","params":[]}]
        );

        runner.runTest(
            'GET | null-wrongEntity | 400',
            '/api/data/item2/public/findbyid/10',
            'get',
            null,
            null,
            [400]
        );

        require("./tests-user")(runner, params);
        require("./tests-item")(runner, params);
        require("./tests-message")(runner, params);
    });
};