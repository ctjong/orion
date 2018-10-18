const express = require("express");

/**
 * Construct an orion app object
 * @param {any} config configuration json
 */
module.exports = function(config)
{
    const _this = new express();
    _this.express = express;

    _this.modules = new (require('./moduleCollection'))();
    _this.contextFactory = new (require('./contextFactory'))();
    _this.contextFactory.initializeConfig(config);

    // register modules
    _this.modules.add("body-parser", 'body-parser');
    _this.modules.add("crypto", 'crypto');
    _this.modules.add("guid", 'uuid/v1');
    _this.modules.add("multiparty", 'multiparty');
    _this.modules.add("mime", 'mime-types');
    _this.modules.add("jwt", 'jsonwebtoken');
    _this.modules.add("https", 'https');
    _this.modules.addClass("create", './handlers/create');
    _this.modules.addClass("createAsset", './handlers/createAsset');
    _this.modules.addClass("delete", './handlers/delete');
    _this.modules.addClass("deleteAsset", './handlers/deleteAsset');
    _this.modules.addClass("read", './handlers/read');
    _this.modules.addClass("update", './handlers/update');
    _this.modules.addClass("auth", './services/auth');
    _this.modules.addClass("exec", './services/exec');
    _this.modules.addClass("helper", './services/helper');
    _this.modules.addClass("conditionFactory", './services/conditionFactory');
    _this.modules.addClass("joinFactory", './services/joinFactory');

    // database system
    if (!config.database || !config.database.engine)
        throw "Missing/incomplete database configuration";
    if (config.database.engine === "mssql")
        _this.modules.addClass("db", './adapters/db/mssqldb');
    else if (config.database.engine === "mysql")
        _this.modules.addClass("db", './adapters/db/mysqldb');
    else
        throw "Unsupported database management system " + config.dbms;

    // storage system
    if (!!config.storage)
    {
        if (config.storage.provider  === "azure")
            _this.modules.addClass("storage", './adapters/storage/azureStorage');
        else if (config.storage.provider  === "s3")
            _this.modules.addClass("storage", './adapters/storage/s3Storage');
        else if (config.storage.provider  === "local")
            _this.modules.addClass("storage", './adapters/storage/localHostStorage');
        else
            throw "Missing or unsupported storage system: " + config.storageSystem;
        _this.modules.get("storage").initialize(config);
    }

    // monitoring system
    if (!!config.monitoring)
    {
        if (!!config.monitoring.appInsightsKey)
            require("applicationinsights").setup(config.monitoring.appInsightsKey).start();
    }

    _this.setupApiEndpoints = () => setupApiEndpoints(_this);
    _this.start = (...args) => start(_this, ...args);
    _this.findById = (...args) => findById(_this, ...args);
    _this.findAll = (...args) => findAll(_this, ...args);
    _this.findByCondition = (...args) => findByCondition(_this, ...args);
    _this.getDatabaseAdapter = (...args) => getDatabaseAdapter(_this, ...args);
    _this.getStorageAdapter = (...args) => getStorageAdapter(_this, ...args);
    return _this;
};

/**
 * Set up API endpoints
 * @param {any} app server application
 */
const setupApiEndpoints = (app) =>
{
    // log request details to console
    app.use("", (req, res, next) =>
    {
        console.log("===============================================================");
        console.log(req.method + " " + req.originalUrl);
        console.log("===============================================================");
        next();
    });

    // configure endpoints
    configureDataEndpoints(app);
    configureAuthEndpoints(app);
    configureUtilityEndpoints(app);

    // catch exceptions and errors
    app.use((err, req, res, next) =>
    {
        try
        {
            app.modules.get("exec").handleError(err, req, res, app.modules.get("db"));
        }
        catch (ex)
        {
            try
            {
                console.error(err);
                res.status(500).send(err);
            }
            catch(ex2) { }
        }
    });
}

/**
 * Start the app at the given port
 * @param {any} app server application
 * @param {any} port optional port to start the app at
 * @param {any} callback optional callback function
 */
const start = (app, port, callback) =>
{
    const finalPort = port || process.env.PORT || 1337;
    const server = app.listen(finalPort, () => 
    {
        const host = server.address().address;
        const port = server.address().port;
        console.log("Listening at http://%s:%s", host, port);
        if(!!callback)
            callback();
    });
    return server;
}

/**
 * Find a record by id
 * @param {any} app server application
 * @param {any} originalReq original request context where app is called from
 * @param {any} entity target entity of the read operation
 * @param {any} id record id
 * @param {any} callback callback function
 */
const findById = (app, originalReq, entity, id, callback) =>
{
    verifyConfig(app);
    const params = { accessType: "public", id: id };
    executeDirectRead(app, originalReq, entity, params, true, callback);
}

/**
 * Find a record by condition
 * @param {any} app server application
 * @param {any} originalReq original request context where app is called from
 * @param {any} entity target entity of the read operation
 * @param {any} orderByField field name to order the results by
 * @param {any} skip number of records to skip (for pagination)
 * @param {any} take number of records to take (for pagination)
 * @param {any} condition condition string
 * @param {any} callback callback function
 */
const findByCondition = (app, originalReq, entity, orderByField, skip, take, condition, callback) =>
{
    verifyConfig(app);
    const params = { accessType: "public", orderByField: orderByField, skip: skip, take: take, condition: condition };
    executeDirectRead(app, originalReq, entity, params, false, callback);
}

/**
 * Get all records for the specified entity
 * @param {any} app server application
 * @param {any} originalReq original request context where app is called from
 * @param {any} entity target entity of the read operation
 * @param {any} orderByField field name to order the results by
 * @param {any} skip number of records to skip (for pagination)
 * @param {any} take number of records to take (for pagination)
 * @param {any} callback callback function
 */
const findAll = (app, originalReq, entity, orderByField, skip, take, callback) =>
{
    verifyConfig(app);
    const params = { accessType: "public", orderByField: orderByField, skip: skip, take: take };
    executeDirectRead(app, originalReq, entity, params, false, callback);
}

/**
 * Get the database adapter for app application
 * @param {any} app server application
 * @returns database adapter module
 */
const getDatabaseAdapter = (app) =>
{
    return app.modules.get("db");
}

/**
 * Get the storage adapter for app application
 * @param {any} app server application
 * @returns storage adapter module
 */
const getStorageAdapter = (app) => 
{
    return app.modules.get("storage");
}

/**
 * Verify that config is properly set in context factory
 * @param {any} app server application
 */
const verifyConfig = (app) =>
{
    if (!app.contextFactory.getConfig())
        throw "setConfig needs to be called before any other orion functions";
}

/**
 * Configure CRUD data endpoints for the given app
 * @param {any} app server application
 */
const configureDataEndpoints = (app) =>
{
    app.use('/api/data/:entity', app.modules.get("body-parser").json());
    app.use('/api/data/:entity', app.modules.get("body-parser").urlencoded({ extended: true }));
    app.use('/api/data/:entity', (req, res, next) =>
    {
        req.context = app.contextFactory.create(req, res, req.params.entity);
        app.modules.get("auth").initUserContext(req.context);
        next();
    });

    // GET Endpoints
    app.get('/api/data/:entity/:accessType/findbyid/:id', (req, res) => 
    {
        app.modules.get("read").execute(req.context, req.params, true);
    });
    app.get('/api/data/:entity/:accessType/findbycondition/:orderByField/:skip/:take/:condition', (req, res) => 
    {
        app.modules.get("read").execute(req.context, req.params, false);
    });
    app.get('/api/data/:entity/:accessType/findall/:orderByField/:skip/:take', (req, res) => 
    {
        app.modules.get("read").execute(req.context, req.params, false);
    });

    // POST Endpoints
    app.post('/api/data/asset', (req, res) =>
    {
        app.modules.get("createAsset").execute(req.context, req);
    });

    app.post('/api/data/:entity', (req, res) =>
    {
        app.modules.get("create").execute(req.context, req.body);
    });

    // PUT Endpoints
    app.put('/api/data/:entity/:id', (req, res) =>
    {
        app.modules.get("update").execute(req.context, req.body, req.params.id);
    });

    // DELETE Endpoints
    app.delete('/api/data/asset/:id', (req, res) =>
    {
        app.modules.get("deleteAsset").execute(req.context, req.params.id);
    });

    app.delete('/api/data/:entity/:id', (req, res) =>
    {
        app.modules.get("delete").execute(req.context, req.params.id);
    });
}

/**
 * Configure authentication endpoints
 * @param {any} app server application
 */
const configureAuthEndpoints = (app) =>
{
    app.use('/api/auth', app.modules.get("body-parser").json());
    app.use('/api/auth', (req, res, next) =>
    {
        req.context = app.contextFactory.create(req, res, "user");
        next();
    });
    app.post('/api/auth/token', (req, res) =>
    {
        app.modules.get("auth").generateLocalUserToken(req.context, req.body.username, req.body.password);
    });
    app.post('/api/auth/token/fb', (req, res) =>
    {
        app.modules.get("auth").processFbToken(req.context, req.body.fbtoken);
    });
}

/**
 * Configure utility endpoints
 * @param {any} app server application
 */
const configureUtilityEndpoints = (app) =>
{
    // error logging
    app.use('/api/error', app.modules.get("body-parser").json());
    app.post('/api/error', (req, res) =>
    {
        const config = app.contextFactory.getConfig();
        if (!config)
        {
            throw { "tag": "13bf", "statusCode": 500, "msg": "missing config" };
        }
        const ctx = { req: req, res: res, config: config };
        app.modules.get("db").insert(
            ctx,
            "error",
            ["tag", "statuscode", "msg", "url", "timestamp"],
            ["48a4", "000", req.body.msg, "POST /error", new Date().getTime()],
            () => { },
            () =>
            {
                res.status(200).send();
            }
        );
    });
}

/**
 * Execute a direct read operation, a read operation that is triggered from the server.
 * @param {any} app server application
 * @param {any} originalReq origianl request context where the read operation is triggered
 * @param {any} entity target entity of the read operation
 * @param {any} params read action parameters
 * @param {any} isFullMode whether or not the read result should be returned in long form
 * @param {any} callback callback function
 */
const executeDirectRead = (app, originalReq, entity, params, isFullMode, callback) =>
{
    const res = {};
    res.status = (status) =>
    {
        if (status !== 200)
            res.statusCode = status;
        return res;
    };
    res.send = (data) =>
    {
        if (res.statusCode !== 200)
            callback({ status: res.statusCode, data: data });
        else
            callback(data);
    };
    res.json = res.send;

    const req = { method: "GET", originalUrl: originalReq.originalUrl };
    const context = app.contextFactory.create(req, res, entity);
    req.context = context;

    app.modules.get("read").execute(context, params, isFullMode);
}