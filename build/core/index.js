"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Express = require("express");
const contextFactory_1 = require("./services/contextFactory");
const applicationInsights = require("applicationinsights");
const dataService_1 = require("./services/dataService");
const bodyParser = require("body-parser");
const execService_1 = require("./services/execService");
const authService_1 = require("./services/authService");
const createAssetHandler_1 = require("./handlers/createAssetHandler");
const createHandler_1 = require("./handlers/createHandler");
const deleteHandler_1 = require("./handlers/deleteHandler");
const deleteAssetHandler_1 = require("./handlers/deleteAssetHandler");
const readHandler_1 = require("./handlers/readHandler");
const updateHandler_1 = require("./handlers/updateHandler");
/**
 * An Orion app object
 */
class Orion {
    /**
     * Construct an Orion app
     * @param config configuration object
     */
    constructor(config) {
        this.app = null;
        this.express = Express;
        this.app = Express();
        // // register modules
        // app.modules.add("body-parser", 'body-parser');
        // app.modules.add("crypto", 'crypto');
        // app.modules.add("guid", 'uuid/v1');
        // app.modules.add("multiparty", 'multiparty');
        // app.modules.add("mime", 'mime-types');
        // app.modules.add("jwt", 'jsonwebtoken');
        // app.modules.add("https", 'https');
        // app.modules.addClass("create", './handlers/create');
        // app.modules.addClass("createAsset", './handlers/createAsset');
        // app.modules.addClass("delete", './handlers/delete');
        // app.modules.addClass("deleteAsset", './handlers/deleteAsset');
        // app.modules.addClass("read", './handlers/read');
        // app.modules.addClass("update", './handlers/update');
        // app.modules.addClass("auth", './services/auth');
        // app.modules.addClass("exec", './services/exec');
        // app.modules.addClass("helper", './services/helper');
        // app.modules.addClass("conditionFactory", './services/conditionFactory');
        // app.modules.addClass("joinFactory", './services/joinFactory');
        // initialize components
        contextFactory_1.contextFactory.initializeConfig(config);
        dataService_1.dataService.initialize(config);
        // setup monitoring
        if (config.monitoring) {
            if (config.monitoring.appInsightsKey)
                applicationInsights.setup(config.monitoring.appInsightsKey).start();
        }
    }
    /**
     * Set up API endpoints
     */
    setupApiEndpoints() {
        // log request details to console
        this.app.use("", (req, res, next) => {
            console.log("===============================================================");
            console.log(req.method + " " + req.originalUrl);
            console.log("===============================================================");
            next();
        });
        // configure endpoints
        this.configureDataEndpoints();
        this.configureAuthEndpoints();
        this.configureUtilityEndpoints();
        // catch exceptions and errors
        this.app.use((err, req, res, next) => {
            try {
                execService_1.execService.handleError(err, req, res, dataService_1.dataService.db);
            }
            catch (ex) {
                try {
                    console.error(err);
                    res.status(500).send(err);
                }
                catch (ex2) { }
            }
        });
    }
    /**
     * Start the app at the given port
     * @param port optional port to start the app at
     * @param callback optional callback function
     * @returns server object
     */
    start(port, callback) {
        const finalPort = port || process.env.PORT || 1337;
        const server = this.app.listen(finalPort, () => {
            const addr = server.address();
            const host = addr.address;
            const port = addr.port;
            console.log("Listening at http://%s:%s", host, port);
            if (callback)
                callback();
        });
        return server;
    }
    /**
     * Find a record by id
     * @param originalReq original request context where app is called from
     * @param entity target entity of the read operation
     * @param id record id
     * @param callback callback function
     * @returns query results
     */
    findById(originalReq, entity, id, callback) {
        this.verifyConfig();
        const params = { accessType: "public", id: id };
        this.executeDirectRead(originalReq, entity, params, true, callback);
    }
    /**
     * Find a record by condition
     * @param originalReq original request context where app is called from
     * @param entity target entity of the read operation
     * @param orderByField field name to order the results by
     * @param skip number of records to skip (for pagination)
     * @param take number of records to take (for pagination)
     * @param condition condition string
     * @param callback callback function
     * @returns query results
     */
    findByCondition(originalReq, entity, orderByField, skip, take, condition, callback) {
        this.verifyConfig();
        const params = { accessType: "public", orderByField: orderByField, skip: skip, take: take, condition: condition };
        this.executeDirectRead(originalReq, entity, params, false, callback);
    }
    /**
     * Get all records for the specified entity
     * @param originalReq original request context where app is called from
     * @param entity target entity of the read operation
     * @param orderByField field name to order the results by
     * @param skip number of records to skip (for pagination)
     * @param take number of records to take (for pagination)
     * @param callback callback function
     * @returns query results
     */
    findAll(originalReq, entity, orderByField, skip, take, callback) {
        this.verifyConfig();
        const params = { accessType: "public", orderByField: orderByField, skip: skip, take: take };
        this.executeDirectRead(originalReq, entity, params, false, callback);
    }
    /**
     * Get the database adapter for app application
     * @returns database adapter module
     */
    getDatabaseAdapter() {
        return dataService_1.dataService.db;
    }
    /**
     * Get the storage adapter for app application
     * @returns storage adapter module
     */
    getStorageAdapter() {
        return dataService_1.dataService.storage;
    }
    /**
     * Verify that config is properly set in context factory
     */
    verifyConfig() {
        if (!contextFactory_1.contextFactory.config)
            throw "setConfig needs to be called before any other orion functions";
    }
    /**
     * Configure CRUD data endpoints for the given app
     */
    configureDataEndpoints() {
        this.app.use('/api/data/:entity', bodyParser.json());
        this.app.use('/api/data/:entity', bodyParser.urlencoded({ extended: true }));
        this.app.use('/api/data/:entity', (req, res, next) => {
            req.context = contextFactory_1.contextFactory.create(req, res, req.params.entity);
            authService_1.authService.initUserContext(req.context);
            next();
        });
        // GET Endpoints
        this.app.get('/api/data/:entity/:accessType/findbyid/:id', (req, res) => {
            readHandler_1.readHandler.execute(req.context, req.params, true);
        });
        this.app.get('/api/data/:entity/:accessType/findbycondition/:orderByField/:skip/:take/:condition', (req, res) => {
            readHandler_1.readHandler.execute(req.context, req.params, false);
        });
        this.app.get('/api/data/:entity/:accessType/findall/:orderByField/:skip/:take', (req, res) => {
            readHandler_1.readHandler.execute(req.context, req.params, false);
        });
        // POST Endpoints
        this.app.post('/api/data/asset', (req, res) => {
            createAssetHandler_1.createAssetHandler.execute(req.context, req);
        });
        this.app.post('/api/data/:entity', (req, res) => {
            createHandler_1.createHandler.execute(req.context, req.body);
        });
        // PUT Endpoints
        this.app.put('/api/data/:entity/:id', (req, res) => {
            updateHandler_1.updateHandler.execute(req.context, req.body, req.params.id);
        });
        // DELETE Endpoints
        this.app.delete('/api/data/asset/:id', (req, res) => {
            deleteAssetHandler_1.deleteAssetHandler.execute(req.context, req.params.id);
        });
        this.app.delete('/api/data/:entity/:id', (req, res) => {
            deleteHandler_1.deleteHandler.execute(req.context, req.params.id);
        });
    }
    /**
     * Configure authentication endpoints
     */
    configureAuthEndpoints() {
        this.app.use('/api/auth', bodyParser.json());
        this.app.use('/api/auth', (req, res, next) => {
            req.context = contextFactory_1.contextFactory.create(req, res, "user");
            next();
        });
        this.app.post('/api/auth/token', (req, res) => {
            authService_1.authService.generateLocalUserToken(req.context, req.body.username, req.body.password);
        });
        this.app.post('/api/auth/token/fb', (req, res) => {
            authService_1.authService.processFbToken(req.context, req.body.fbtoken);
        });
    }
    /**
     * Configure utility endpoints
     */
    configureUtilityEndpoints() {
        // error logging
        this.app.use('/api/error', bodyParser.json());
        this.app.post('/api/error', (req, res) => {
            const config = contextFactory_1.contextFactory.config;
            if (!config) {
                throw { "tag": "13bf", "statusCode": 500, "msg": "missing config" };
            }
            const ctx = { req: req, res: res, config: config };
            dataService_1.dataService.db.insert(ctx, "error", ["tag", "statuscode", "msg", "url", "timestamp"], ["48a4", "000", req.body.msg, "POST /error", new Date().getTime()]);
        });
    }
    /**
     * Execute a direct read operation, a read operation that is triggered from the server.
     * @param originalReq origianl request context where the read operation is triggered
     * @param entity target entity of the read operation
     * @param params read action parameters
     * @param isFullMode whether or not the read result should be returned in long form
     * @param callback callback function
     */
    executeDirectRead(originalReq, entity, params, isFullMode, callback) {
        const res = {};
        res.status = (status) => {
            if (status !== 200)
                res.statusCode = status;
            return res;
        };
        res.send = (data) => {
            if (res.statusCode !== 200)
                callback({ status: res.statusCode, data: data });
            else
                callback(data);
        };
        res.json = res.send;
        const req = { method: "GET", originalUrl: originalReq.originalUrl };
        const context = contextFactory_1.contextFactory.create(req, res, entity);
        req.context = context;
        readHandler_1.readHandler.execute(context, params, isFullMode);
    }
}
exports.default = Orion;
