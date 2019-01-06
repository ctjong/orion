const mssql = require("mssql");
const mysql = require("mysql");
const Orion = require("orion-api");
const MockStorageCommandWrapper = require("./mockStorageCommandWrapper");

const DB_RETRY_INTERVAL = 3;
const ASSET_BASE_PATH = `${process.env.temp}/oriontest`;

// TODO: include env variables in the repo, set up storage tests, pass ASSET_BASE_PATH to mock storage wrapper

/**
 * Entry point
 */
async function main()
{
    const config = getConfigObject();
    await verifyDatabaseConnectionAsync(config);

    const storageAdapter = createStorageAdapter(config);
    startServer(config, storageAdapter);
}

/**
 * Start the server
 * @param config config object
 * @param storageAdapter storage adapter object
 */
function startServer(config, storageAdapter)
{
    console.log("Starting server");
    const orionApp = new Orion.App(config, null, storageAdapter);
    orionApp.setupApiEndpoints();
    orionApp.app.get("/healthcheck", (req, res) => res.status(200).end());
    orionApp.app.get("/files/:fileName", (req, res) => res.sendFile(`${ASSET_BASE_PATH}/${req.params.fileName}`));
    orionApp.startAsync();
}

/**
 * Get the config object based on environment settings
 */
function getConfigObject()
{
    console.log("Getting config object");
    let configName = process.env.ACTIVE_CONFIG;
    if (!configName)
    {
        if (process.argv.length < 3)
        {
            console.log("Usage: node server.js <confg name>");
            return;
        }
        configName = process.argv[2];
    }
    const config = require('./config-' + configName);
    return config;
}

/**
 * Create storage adapter based on the specified configuration
 * @param config config object
 */
function createStorageAdapter(config)
{
    if (!config.storage)
        return null;

    const provider = config.storage.provider;
    if (provider === "azure")
        return new Orion.AzureStorageAdapter(config, new MockStorageCommandWrapper());
    else if (provider === "s3")
        return new Orion.S3StorageAdapter(config, new MockStorageCommandWrapper());
    else if (provider === "local")
        return new Orion.LocalStorageAdapter(config, new MockStorageCommandWrapper());
    return null
}

/**
 * Verify the database connnection. Because of the way Docker starts the containers,
 * sometimes it is possible that this application is started before the database is set up.
 * See this link for more details: https://docs.docker.com/compose/startup-order/
 * @param config config object
 */
async function verifyDatabaseConnectionAsync(config)
{
    console.log("Checking DB connection");
    while (true)
    {
        try
        {
            if (config.database.dialect === "mssql")
                await verifyMssqlConnectionAsync(config);
            if (config.database.dialect === "mysql")
                await verifyMysqlConnectionAsync(config);
            break;
        }
        catch (e)
        {
            console.log(`DB connection is bad. Retrying in ${DB_RETRY_INTERVAL} seconds. Here is the details:`);
            console.log(e);
            await sleepAsync(DB_RETRY_INTERVAL);
        }
    }
    console.log("DB connection is good");
}

/**
 * Verify a MSSQL database connnection. This should throw an exception if connection is bad.
 * @param config config object
 */
async function verifyMssqlConnectionAsync(config)
{
    const mssqlConfig =
    {
        server: config.database.host,
        user: config.database.userName,
        password: config.database.password
    };
    const dbName = config.database.name;
    const pool = await new mssql.ConnectionPool(mssqlConfig).connect();
    await pool.request().query(`if not exists(select * from sys.databases where name = '${dbName}') create database ${dbName}`);
}

/**
 * Verify a MYSQL database connnection. This should throw an exception if connection is bad.
 * @param config config object
 */
async function verifyMysqlConnectionAsync(config)
{
    const dbName = config.database.name;
    const conn = mysql.createConnection(
        {
            host: config.database.host,
            user: config.database.userName,
            password: config.database.password
        });
    const success = await new Promise(resolve =>
    {
        conn.connect(err => 
        {
            if (err)
                resolve(false);
            conn.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
            resolve(true);
        });
    });
    if (!success)
        throw "Bad mysql connection";
}

/**
 * Put the thread to sleep for the specified number of seconds
 * @param numSeconds Sleep duration
 */
function sleepAsync(numSeconds)
{
    return new Promise(resolve =>
    {
        setTimeout(resolve, numSeconds * 1000);
    });
}

main();