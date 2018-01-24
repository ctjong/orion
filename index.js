/*===================================================
    GLOBAL VARIABLES AND MODULES INIT
===================================================*/

var modules = new (require('./modules/moduleCollection'))();
var contextFactory = new (require('./modules/contextFactory'))();

modules.add("body-parser", 'body-parser');
modules.add("captcha", 'svg-captcha');
modules.add("crypto", 'crypto');
modules.add("guid", 'guid');
modules.add("multiparty", 'multiparty');
modules.add("mime", 'mime-types');
modules.add("jwt", 'jsonwebtoken');
modules.add("https", 'https');
modules.addDef("error", './modules/errorFactory');
modules.addDef("condition", './modules/models/condition');
modules.addDef("join", './modules/models/join');
modules.addDef("create", './modules/handlers/create');
modules.addDef("createAsset", './modules/handlers/createAsset');
modules.addDef("delete", './modules/handlers/delete');
modules.addDef("deleteAsset", './modules/handlers/deleteAsset');
modules.addDef("read", './modules/handlers/read');
modules.addDef("update", './modules/handlers/update');
modules.addDef("auth", './modules/services/auth');
modules.addDef("exec", './modules/services/exec');
modules.addDef("helper", './modules/services/helper');


/*===================================================
    PUBLIC FUNCTIONS
===================================================*/

/**
 * Set project configuration
 * @param {any} config configuration json
 */
function setConfig(config)
{
    contextFactory.initializeConfig(config);

    // database system
    if (!config.database || !config.database.engine)
        throw "Missing/incomplete database configuration";
    if (config.database.engine === "mssql")
        modules.addDef("db", './modules/db/mssqldb');
    else if (config.database.engine === "mysql")
        modules.addDef("db", './modules/db/mysqldb');
    else
        throw "Unsupported database management system " + config.dbms;

    // storage system
    if (!!config.storage)
    {
        if (config.storage.provider  === "azure")
            modules.addDef("storage", './modules/storage/azureStorage');
        else if (config.storage.provider  === "s3")
            modules.addDef("storage", './modules/storage/s3Storage');
        else if (config.storage.provider  === "local")
            modules.addDef("storage", './modules/storage/localHostStorage');
        else
            throw "Missing or unsupported storage system: " + config.storageSystem;
    }

    // monitoring system
    if (!!config.monitoring)
    {
        if (!!config.monitoring.appInsightsKey)
            require("applicationinsights").setup(config.monitoring.appInsightsKey).start();
    }
}

/**
 * Set up API endpoints for the given app
 * @param {any} app Express API app
 */
function setupApiEndpoints(app)
{
    verifyConfig();

    // log request details to console
    app.use("", function (req, res, next) 
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
    app.use(function (err, req, res, next) 
    {
        try
        {
            modules.get("exec").handleError(err, req, res, modules.get("db"));
        }
        catch (ex)
        {
            console.error(err);
            res.status(500).send(err);
        }
    });
}

/**
 * Start the given API app at the given port (if provided)
 * @param {any} app API app
 * @param {any} port port for incoming requests (optional). Default is 1337.
 */
function startApiApp(app, port)
{
    verifyConfig();
    var finalPort = port || process.env.PORT || 1337;
    var server = app.listen(finalPort, function () 
    {
        var host = server.address().address;
        var port = server.address().port;
        console.log("Listening at http://%s:%s", host, port);
    });
}

/**
 * Find a record by id
 * @param {any} originalReq original request context where this is called from
 * @param {any} entity target entity of the read operation
 * @param {any} id record id
 * @param {any} callback callback function
 */
function findById(originalReq, entity, id, callback)
{
    verifyConfig();
    var params = { accessType: "public", id: id };
    executeDirectRead(originalReq, entity, params, true, callback);
}

/**
 * Find a record by condition
 * @param {any} originalReq original request context where this is called from
 * @param {any} entity target entity of the read operation
 * @param {any} orderByField field name to order the results by
 * @param {any} skip number of records to skip (for pagination)
 * @param {any} take number of records to take (for pagination)
 * @param {any} condition condition string
 * @param {any} callback callback function
 */
function findByCondition(originalReq, entity, orderByField, skip, take, condition, callback)
{
    verifyConfig();
    var params = { accessType: "public", orderByField: orderByField, skip: skip, take: take, condition: condition };
    executeDirectRead(originalReq, entity, params, false, callback);
}

/**
 * Get all records for the specified entity
 * @param {any} originalReq original request context where this is called from
 * @param {any} entity target entity of the read operation
 * @param {any} orderByField field name to order the results by
 * @param {any} skip number of records to skip (for pagination)
 * @param {any} take number of records to take (for pagination)
 * @param {any} callback callback function
 */
function findAll(originalReq, entity, orderByField, skip, take, callback)
{
    verifyConfig();
    var params = { accessType: "public", orderByField: orderByField, skip: skip, take: take };
    executeDirectRead(originalReq, entity, params, false, callback);
}


/*===================================================
    PRIVATE FUNCTIONS
===================================================*/

/**
 * Verify that config is properly set in context factory
 */
function verifyConfig()
{
    if (!contextFactory.getConfig())
        throw "setConfig needs to be called before any other orion functions";
}

/**
 * Configure CRUD data endpoints for the given app
 * @param {any} app API app
 */
function configureDataEndpoints(app)
{
    app.use('/api/data/:entity', modules.get("body-parser").json());
    app.use('/api/data/:entity', modules.get("body-parser").urlencoded({ extended: true }));
    app.use('/api/data/:entity', function (req, res, next) 
    {
        req.context = new contextFactory.Context(req, res, req.params.entity);
        modules.get("auth").initUserContext(req.context);
        next();
    });

    // GET Endpoints
    app.get('/api/data/:entity/:accessType/findbyid/:id', function (req, res) 
    {
        modules.get("read").execute(req.context, req.params, true);
    });
    app.get('/api/data/:entity/:accessType/findbycondition/:orderByField/:skip/:take/:condition', function (req, res) 
    {
        modules.get("read").execute(req.context, req.params, false);
    });
    app.get('/api/data/:entity/:accessType/findall/:orderByField/:skip/:take', function (req, res) 
    {
        modules.get("read").execute(req.context, req.params, false);
    });

    // POST Endpoints
    app.post('/api/data/asset', function (req, res)
    {
        modules.get("createAsset").execute(req.context, req);
    });

    app.post('/api/data/:entity', function (req, res)
    {
        modules.get("create").execute(req.context, req.body);
    });

    // PUT Endpoints
    app.put('/api/data/:entity/:id', function (req, res)
    {
        modules.get("update").execute(req.context, req.body, req.params.id);
    });

    // DELETE Endpoints
    app.delete('/api/data/asset/:id', function (req, res)
    {
        modules.get("deleteAsset").execute(req.context, req.params.id);
    });

    app.delete('/api/data/:entity/:id', function (req, res)
    {
        modules.get("delete").execute(req.context, req.params.id);
    });
}

/**
 * Configure authentication endpoints for the given app
 * @param {any} app API app
 */
function configureAuthEndpoints(app)
{
    app.use('/api/auth', modules.get("body-parser").json());
    app.use('/api/auth', function (req, res, next)
    {
        req.context = new contextFactory.Context(req, res, "user");
        next();
    });
    app.post('/api/auth/token', function (req, res)
    {
        modules.get("auth").generateLocalUserToken(req.context, req.body.username, req.body.password);
    });
    app.post('/api/auth/token/fb', function (req, res)
    {
        modules.get("auth").processFbToken(req.context, req.body.fbtoken);
    });
}

/**
 * Configure utility endpoints for the given app
 * @param {any} app API app
 */
function configureUtilityEndpoints(app)
{
    // error logging
    app.use('/api/error', modules.get("body-parser").json());
    app.post('/api/error', function (req, res)
    {
        var config = contextFactory.getConfig();
        if (!config)
        {
            throw { "tag": "13bf", "statusCode": 500, "msg": "missing config" };
        }
        var ctx = { req: req, res: res, config: config };
        modules.get("db").insert(
            ctx,
            "error",
            ["tag", "statuscode", "msg", "url", "timestamp"],
            ["48a4", "000", req.body.msg, "POST /error", new Date().getTime()],
            function () { },
            function ()
            {
                res.status(200).send();
            }
        );
    });

    // captcha
    app.get('/api/captcha', function (req, res)
    {
        var captcha = modules.get("captcha").create();
        req.session.captchaExpected = captcha.text;
        res.set('Content-Type', 'image/svg+xml');
        res.send(captcha.data);
    });
}

/**
 * Execute a direct read operation, a read operation that is triggered from the server.
 * @param {any} originalReq origianl request context where the read operation is triggered
 * @param {any} entity target entity of the read operation
 * @param {any} params read action parameters
 * @param {any} isFullMode whether or not the read result should be returned in long form
 * @param {any} callback callback function
 */
function executeDirectRead(originalReq, entity, params, isFullMode, callback)
{
    var res = {};
    res.status = function (status)
    {
        if (status !== 200)
            res.statusCode = status;
        return res;
    };
    res.send = function (data)
    {
        if (res.statusCode !== 200)
            callback({ status: res.statusCode, data: data });
        else
            callback(data);
    };
    res.json = res.send;

    var req = { method: "GET", originalUrl: originalReq.originalUrl };
    var context = new contextFactory.Context(req, res, entity);
    req.context = context;

    modules.get("read").execute(context, params, isFullMode);
}


/*===================================================
    EXPOSE PUBLIC FUNCTIONS
===================================================*/

exports.setConfig = setConfig;
exports.setupApiEndpoints = setupApiEndpoints;
exports.startApiApp = startApiApp;
exports.findById = findById;
exports.findByCondition = findByCondition;
exports.findAll = findAll;