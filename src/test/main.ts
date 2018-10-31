import { Config } from "../core/types";
import { Runner } from './runner';
import { configFactory } from './configFactory';
import { assetTestSuite } from './tests/tests-asset';
import { errorTestSuite } from './tests/tests-error';
import { itemTestSuite } from './tests/tests-item';
import { messageTestSuite } from './tests/tests-message';
import { userTestSuite } from './tests/tests-user';
import { MockConnectionPool } from "./mocks/mockConnectionPool";
import { MysqlDatabase } from "../core/adapters/db/mysqlDatabase";
import { MssqlDatabase } from "../core/adapters/db/mssqlDatabase";
import { MockStorageProvider } from "./mocks/mockStorageProvider";
import { AzureStorage } from "../core/adapters/storage/azureStorage";
import { LocalHostStorage } from "../core/adapters/storage/localHostStorage";
import { Database } from "../core/database";
import { Storage } from "../core/storage";
import { S3Storage } from "../core/adapters/storage/s3Storage";

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

    // initialize database modules
    const mssqlPool = new MockConnectionPool("mssql");
    const mysqlPool = new MockConnectionPool("mysql");
    const mssqlAdapter = new MssqlDatabase(mssqlAzureConfig, mssqlPool);
    const mysqlAdapter = new MysqlDatabase(mysqlS3Config, mysqlPool);

    // initialize storage modules
    const mockProvider = new MockStorageProvider();
    const azureAdapter = new AzureStorage(mssqlAzureConfig, mockProvider);
    const s3Adapter = new S3Storage(mysqlS3Config, mockProvider);
    const localHostAdapter = new LocalHostStorage(mssqlLocalConfig, mockProvider);

    // run tests
    startTestSession(mssqlAzureConfig, mssqlAdapter, azureAdapter, mssqlPool, "mssql-azure", [errorTestSuite, itemTestSuite, messageTestSuite, userTestSuite, assetTestSuite]);
    startTestSession(mysqlS3Config, mysqlAdapter, s3Adapter, mysqlPool, "mysql-s3", [errorTestSuite, itemTestSuite, messageTestSuite, userTestSuite, assetTestSuite]);
    startTestSession(mssqlLocalConfig, mssqlAdapter, localHostAdapter, mssqlPool, "mssql-local", [assetTestSuite]);
    startTestSession(mysqlLocalConfig, mysqlAdapter, localHostAdapter, mysqlPool, "mysql-local", [assetTestSuite]);
};

/**
 * Start a new test session
 * @param config Config module
 * @param databaseAdapter Database adapter module
 * @param storageAdapter Storage adapter module
 * @param pool Mock database connection pool
 * @param sessionName Session name
 * @param testSuites List of test suites to run
 */
const startTestSession = (config: Config, databaseAdapter:Database, storageAdapter:Storage, pool:MockConnectionPool, sessionName: string, testSuites: any[]) =>
{
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