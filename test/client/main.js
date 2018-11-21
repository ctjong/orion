const Runner = require('./runner');
const configFactory = require('./configFactory');
const assetTestSuite = require('./tests/tests-asset');
const errorTestSuite = require('./tests/tests-error');
const itemTestSuite = require('./tests/tests-item');
const messageTestSuite = require('./tests/tests-message');
const userTestSuite = require('./tests/tests-user');
const MockConnectionPool = require("./mocks/mockConnectionPool");
const MockStorageCommandWrapper = require("../server/mockStorageCommandWrapper");
const AzureStorageAdapter = require("../../src/storage/azureStorageAdapter");
const LocalStorageAdapter = require("../../src/storage/localStorageAdapter");
const S3StorageAdapter = require("../../src/storage/s3StorageAdapter");
const MockSqlQueryWrapper = require("./mocks/mockSqlQueryWrapper");
const SqlDatabaseAdapter = require("../../src/database/sqlDatabaseAdapter");

/** 
 * Test entry point
 */
const main = () =>
{
    // initialize configs
    const mssqlAzureConfig = configFactory.create("mssql", { provider: "azure", azureStorageConnectionString: "blah" });
    const mysqlS3Config = configFactory.create("mysql", { provider: "s3", awsAccessKeyId: "blah", awsSecretAccessKey: "blahh" });
    const mssqlLocalConfig = configFactory.create("mssql", { provider: "local", uploadPath: "uploads" });
    const mysqlLocalConfig = configFactory.create("mysql", { provider: "local", uploadPath: "uploads" });

    // initialize storage modules
    const azureAdapter = new AzureStorageAdapter(mssqlAzureConfig, new MockStorageCommandWrapper());
    const s3Adapter = new S3StorageAdapter(mysqlS3Config, new MockStorageCommandWrapper());
    const localAdapter = new LocalStorageAdapter(mssqlLocalConfig, new MockStorageCommandWrapper());

    // run tests
    startTestSession(mssqlAzureConfig, azureAdapter, new MockConnectionPool("mssql"), "mssql-azure", [errorTestSuite, itemTestSuite, messageTestSuite, userTestSuite, assetTestSuite]);
    startTestSession(mysqlS3Config, s3Adapter, new MockConnectionPool("mysql"), "mysql-s3", [errorTestSuite, itemTestSuite, messageTestSuite, userTestSuite, assetTestSuite]);
    startTestSession(mssqlLocalConfig, localAdapter, new MockConnectionPool("mssql"), "mssql-local", [assetTestSuite]);
    startTestSession(mysqlLocalConfig, localAdapter, new MockConnectionPool("mysql"), "mysql-local", [assetTestSuite]);
};

/**
 * Start a new test session
 * @param config Config module
 * @param storageAdapter Storage adapter module
 * @param pool Mock database connection pool
 * @param sessionName Session name
 * @param testSuites List of test suites to run
 */
const startTestSession = (config, storageAdapter, pool, sessionName, testSuites) =>
{
    const databaseAdapter = new SqlDatabaseAdapter(config, new MockSqlQueryWrapper());
    const runner = new Runner(config, databaseAdapter, storageAdapter, pool);

    before(() =>
    {
        return runner.startServerAsync();
    });

    describe(sessionName, () =>
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

        for (const testSuite of testSuites)
        {
            testSuite.run(runner, params);
        }
    });
};

main();