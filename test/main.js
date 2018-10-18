(() =>
{
    const Runner = require('./runner');
    const configFactory = require('./configFactory');

    const assetTests = require('./tests/tests-asset');
    const errorTests = require('./tests/tests-error');
    const itemTests = require('./tests/tests-item');
    const messageTests = require('./tests/tests-message');
    const userTests = require('./tests/tests-user');

    /** 
     * Test entry point
     */
    const main = () =>
    {
        // initialize configs
        const mssqlAzureConfig = configFactory.create("mssql", { provider: "azure" });
        const mysqlS3Config = configFactory.create("mysql", { provider: "s3" });
        const mssqlLocalConfig = configFactory.create("mssql", { provider: "local", uploadPath: "uploads" });
        const mysqlLocalConfig = configFactory.create("mysql", { provider: "local", uploadPath: "uploads" });

        // run tests
        startTestSession(mssqlAzureConfig, "mssql", "azure", "mssql-azure", [errorTests, itemTests, messageTests, userTests, assetTests]);
        startTestSession(mysqlS3Config, "mysql", "s3", "mysql-s3", [errorTests, itemTests, messageTests, userTests, assetTests]);
        startTestSession(mssqlLocalConfig, "mssql", "local", "mssql-local", [assetTests]);
        startTestSession(mysqlLocalConfig, "mysql", "local", "mysql-local", [assetTests]);
    }

    /**
     * Start a new test session
     * @param {*} config Config module
     * @param {*} engine Database engine
     * @param {*} storageProviderName Storage provider name
     * @param {*} sessionName Session name
     * @param {*} tests List of tests to run
     */
    const startTestSession = (config, engine, storageProviderName, sessionName, tests) =>
    {
        const runner = new Runner(config, engine, storageProviderName);

        before((done) =>
        {
            if(!runner.isServerStarted)
                runner.startServer(done);
        });

        describe(sessionName, function()
        {
            const params = 
            {
                // { id: "1", domain: "local", domainId: null, roles: "member" }
                user1Token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJkb21haW4iOiJsb2NhbCIsImRvbWFpbklkIjpudWxsLCJyb2xlcyI6Im1lbWJlciIsImlhdCI6MTUxOTQ1OTYyOH0.MWjNP36TRnrBTmtDQqLN3tWRn06eASEu7Z4_7ocYrcU",
                // { id: "2", domain: "local", domainId: null, roles: "member" }
                user2Token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjIiLCJkb21haW4iOiJsb2NhbCIsImRvbWFpbklkIjpudWxsLCJyb2xlcyI6Im1lbWJlciIsImlhdCI6MTUxOTQ1OTYxNH0.MnZ6M-ebkIvomy-Ls1ICgYctQecO9xwqA1ggiqI5b2k",
                // { id: "3", domain: "local", domainId: null, roles: "member" }
                user3Token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjMiLCJkb21haW4iOiJsb2NhbCIsImRvbWFpbklkIjpudWxsLCJyb2xlcyI6Im1lbWJlciIsImlhdCI6MTUxOTQ1OTU5MX0.1-sM6LWj3m51LAi_c3QRaCSooIo21NiWv0POw-wrHDg",
                // testpassword
                hashedPassword: "3a6ad575db2b6a2a170f26505dff23a2b0ec337b34c011269ccd4e024e25847eea9e5023e58dd4084c94dea5127ab4e3f7c2122a2ef208c81e6035de37ccfec8"
            };

            for(let i=0; i<tests.length; i++)
                tests[i](runner, params);
        });
    }

    main();
})();