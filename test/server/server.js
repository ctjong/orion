const mssql = require("mssql");
const mysql = require("mysql");
const Orion = require("../../build/index");

const DB_RETRY_INTERVAL = 3;

/**
 * Entry point
 */
async function main()
{
    const config = getConfigObject();
    if (config.database.dialect === "mssql")
        await verifyMssqlConnectionAsync(config);
    if (config.database.dialect === "mysql")
        await verifyMysqlConnectionAsync(config);
    startServer(config);
}

/**
 * Start the server
 * @param config config object
 */
function startServer(config)
{
    console.log("Starting server");
    const orionApp = new Orion(config);
    orionApp.setupApiEndpoints();

    orionApp.app.get("/healthcheck", function (req, res) 
    {
        res.status(200).end();
    });

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
 * Verify a MSSQL database connnection. Because of the way Docker starts the containers,
 * sometimes it is possible that this application is started before the database is set up.
 * @param config config object
 */
async function verifyMssqlConnectionAsync(config)
{
    console.log("Checking DB connection (MSSQL)");
    let success = false;
    while (!success)
    {
        try
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
            success = true;
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
 * Verify a MYSQL database connnection. Because of the way Docker starts the containers,
 * sometimes it is possible that this application is started before the database is set up.
 * @param config config object
 */
async function verifyMysqlConnectionAsync(config)
{
    console.log("Checking DB connection (MYSQL)");
    let success = false;
    while (!success)
    {
        try
        {
            const dbName = config.database.name;
            const conn = mysql.createConnection(
                {
                    host: config.database.host,
                    user: config.database.userName,
                    password: config.database.password
                });
            success = await new Promise(resolve =>
            {
                conn.connect(err => 
                {
                    if (err)
                        resolve(false);
                    conn.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
                    resolve(true);
                });
            });
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