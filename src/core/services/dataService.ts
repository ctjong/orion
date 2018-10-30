import { Config } from '../types';
import { Database } from '../database';
import { Storage } from '../storage';
import { MssqlDatabase } from '../adapters/db/mssqlDatabase';
import { MysqlDatabase } from '../adapters/db/mysqlDatabase';
import { AzureStorage } from '../adapters/storage/azureStorage';
import { LocalHostStorage } from '../adapters/storage/localHostStorage';
import { S3Storage } from '../adapters/storage/s3Storage';

class DataService
{
    private db: Database;
    private storage: Storage;

    /**
     * Initialize the service
     * @param config Config object
     * @param databaseAdapter optional database adapter module
     * @param storageAdapter optional storage adapter module
     */
    initialize(config:Config, databaseAdapter?:Database, storageAdapter?: Storage): void
    {
        // database system
        if(databaseAdapter)
            this.db = databaseAdapter;
        else
        {
            if (!config.database || !config.database.engine)
                throw "Missing/incomplete database configuration";
            if (config.database.engine === "mssql")
                this.db = new MssqlDatabase(config);
            else if (config.database.engine === "mysql")
                this.db = new MysqlDatabase(config);
            else
                throw "Unsupported database management system " + config.database.engine;
        }
    
        // storage system
        if(storageAdapter)
            this.storage = storageAdapter;
        else
        {
            if (config.storage)
            {
                if (config.storage.provider  === "azure")
                    this.storage = new AzureStorage(config);
                else if (config.storage.provider  === "s3")
                    this.storage = new S3Storage(config);
                else if (config.storage.provider  === "local")
                    this.storage = new LocalHostStorage(config);
                else
                    throw "Missing or unsupported storage system: " + config.storage.provider;
            }
        }
    }

    /**
     * Get the database adapter module
     * @returns database adapter module
     */
    getDatabaseAdapter(): Database
    {
        return this.db;
    }

    /**
     * Get the storage adapter module
     * @returns storage adapter module
     */
    getStorageAdapter(): Storage
    {
        return this.storage;
    }
}

const dataService = new DataService();
export { dataService };