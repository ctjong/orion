"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("./runner");
const configFactory_1 = require("./configFactory");
const tests_asset_1 = require("./tests/tests-asset");
const tests_error_1 = require("./tests/tests-error");
const tests_item_1 = require("./tests/tests-item");
const tests_message_1 = require("./tests/tests-message");
const tests_user_1 = require("./tests/tests-user");
/**
 * Test entry point
 */
const main = () => {
    // initialize configs
    const mssqlAzureConfig = configFactory_1.configFactory.create("mssql", { provider: "azure" });
    const mysqlS3Config = configFactory_1.configFactory.create("mysql", { provider: "s3" });
    const mssqlLocalConfig = configFactory_1.configFactory.create("mssql", { provider: "local", uploadPath: "uploads" });
    const mysqlLocalConfig = configFactory_1.configFactory.create("mysql", { provider: "local", uploadPath: "uploads" });
    // run tests
    startTestSession(mssqlAzureConfig, "mssql", "azure", "mssql-azure", [tests_error_1.errorTestSuite, tests_item_1.itemTestSuite, tests_message_1.messageTestSuite, tests_user_1.userTestSuite, tests_asset_1.assetTestSuite]);
    startTestSession(mysqlS3Config, "mysql", "s3", "mysql-s3", [tests_error_1.errorTestSuite, tests_item_1.itemTestSuite, tests_message_1.messageTestSuite, tests_user_1.userTestSuite, tests_asset_1.assetTestSuite]);
    startTestSession(mssqlLocalConfig, "mssql", "local", "mssql-local", [tests_asset_1.assetTestSuite]);
    startTestSession(mysqlLocalConfig, "mysql", "local", "mysql-local", [tests_asset_1.assetTestSuite]);
};
exports.main = main;
/**
 * Start a new test session
 * @param config Config module
 * @param engine Database engine
 * @param storageProviderName Storage provider name
 * @param sessionName Session name
 * @param testSuites List of test suites to run
 */
const startTestSession = (config, engine, storageProviderName, sessionName, testSuites) => {
    const runner = new runner_1.Runner(config, engine, storageProviderName);
    before((done) => __awaiter(this, void 0, void 0, function* () {
        if (!runner.isServerStarted) {
            yield runner.startServer();
            done();
        }
    }));
    describe(sessionName, () => {
        const params = {
            // { id: "1", domain: "local", domainId: null, roles: "member" }
            user1Token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJkb21haW4iOiJsb2NhbCIsImRvbWFpbklkIjpudWxsLCJyb2xlcyI6Im1lbWJlciIsImlhdCI6MTUxOTQ1OTYyOH0.MWjNP36TRnrBTmtDQqLN3tWRn06eASEu7Z4_7ocYrcU",
            // { id: "2", domain: "local", domainId: null, roles: "member" }
            user2Token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjIiLCJkb21haW4iOiJsb2NhbCIsImRvbWFpbklkIjpudWxsLCJyb2xlcyI6Im1lbWJlciIsImlhdCI6MTUxOTQ1OTYxNH0.MnZ6M-ebkIvomy-Ls1ICgYctQecO9xwqA1ggiqI5b2k",
            // { id: "3", domain: "local", domainId: null, roles: "member" }
            user3Token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjMiLCJkb21haW4iOiJsb2NhbCIsImRvbWFpbklkIjpudWxsLCJyb2xlcyI6Im1lbWJlciIsImlhdCI6MTUxOTQ1OTU5MX0.1-sM6LWj3m51LAi_c3QRaCSooIo21NiWv0POw-wrHDg",
            // testpassword
            hashedPassword: "3a6ad575db2b6a2a170f26505dff23a2b0ec337b34c011269ccd4e024e25847eea9e5023e58dd4084c94dea5127ab4e3f7c2122a2ef208c81e6035de37ccfec8"
        };
        for (const testSuite of testSuites) {
            testSuite.run(runner, params);
        }
    });
};
