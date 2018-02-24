var chai = require('chai');
var chaiHttp = require('chai-http');
var assert = require('assert');
var runnerClass = require('./runner');
var orion = require('../index');

var mockMssqlConnectionPool = require('../test/mocks/mockMssqlConnectionPool');
var mockMysqlConnectionPool = require('../test/mocks/mockMysqlConnectionPool');
var mockAzureStorageProvider = require('../test/mocks/mockAzureStorageProvider');
var mockS3StorageProvider = require('../test/mocks/mockS3StorageProvider');

var mssqlAzureConfig = require('../test/configs/config-mssql-azure');
var mysqlS3Config = require('../test/configs/config-mysql-s3');
var mssqlLocalConfig = require('../test/configs/config-mssql-local');
var mysqlLocalConfig = require('../test/configs/config-mysql-local');

var should = chai.should();
chai.use(chaiHttp);
var runner = new runnerClass(chai);

var dataTests = require('../test/tests/data');
dataTests(orion, chai, runner, "data-mssql", mssqlAzureConfig, mockMssqlConnectionPool);