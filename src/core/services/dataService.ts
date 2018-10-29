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
    db: Database;
    storage: Storage;

    /**
     * Initialize the service
     * @param config Config object
     */
    initialize(config:Config): void
    {
        // database system
        if (!config.database || !config.database.engine)
            throw "Missing/incomplete database configuration";
        if (config.database.engine === "mssql")
            this.db = new MssqlDatabase();
        else if (config.database.engine === "mysql")
            this.db = new MysqlDatabase();
        else
            throw "Unsupported database management system " + config.database.engine;
    
        // storage system
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

const dataService = new DataService();
export { dataService };