"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mssqlDatabase_1 = require("../adapters/db/mssqlDatabase");
const mysqlDatabase_1 = require("../adapters/db/mysqlDatabase");
const azureStorage_1 = require("../adapters/storage/azureStorage");
const localHostStorage_1 = require("../adapters/storage/localHostStorage");
const s3Storage_1 = require("../adapters/storage/s3Storage");
class DataService {
    /**
     * Initialize the service
     * @param config Config object
     */
    initialize(config) {
        // database system
        if (!config.database || !config.database.engine)
            throw "Missing/incomplete database configuration";
        if (config.database.engine === "mssql")
            this.db = new mssqlDatabase_1.MssqlDatabase();
        else if (config.database.engine === "mysql")
            this.db = new mysqlDatabase_1.MysqlDatabase();
        else
            throw "Unsupported database management system " + config.database.engine;
        // storage system
        if (config.storage) {
            if (config.storage.provider === "azure")
                this.storage = new azureStorage_1.AzureStorage(config);
            else if (config.storage.provider === "s3")
                this.storage = new s3Storage_1.S3Storage(config);
            else if (config.storage.provider === "local")
                this.storage = new localHostStorage_1.LocalHostStorage(config);
            else
                throw "Missing or unsupported storage system: " + config.storage.provider;
        }
    }
}
const dataService = new DataService();
exports.dataService = dataService;
