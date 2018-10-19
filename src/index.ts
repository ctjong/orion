import * as Express from "express";
import { Config } from "./types";
import { ContextFactory } from "./contextFactory";
import { setup as applicationInsightsSetup } from "applicationinsights";

/**
 * Construct an orion app object
 * @param {any} config configuration json
 */
export default function(config: Config) : Express.Express
{
    const app:any = Express();
    app.express = Express;

    app.contextFactory = new ContextFactory(config);
    app.contextFactory.initializeConfig(config);

    // register modules
    app.modules.add("body-parser", 'body-parser');
    app.modules.add("crypto", 'crypto');
    app.modules.add("guid", 'uuid/v1');
    app.modules.add("multiparty", 'multiparty');
    app.modules.add("mime", 'mime-types');
    app.modules.add("jwt", 'jsonwebtoken');
    app.modules.add("https", 'https');
    app.modules.addClass("create", './handlers/create');
    app.modules.addClass("createAsset", './handlers/createAsset');
    app.modules.addClass("delete", './handlers/delete');
    app.modules.addClass("deleteAsset", './handlers/deleteAsset');
    app.modules.addClass("read", './handlers/read');
    app.modules.addClass("update", './handlers/update');
    app.modules.addClass("auth", './services/auth');
    app.modules.addClass("exec", './services/exec');
    app.modules.addClass("helper", './services/helper');
    app.modules.addClass("conditionFactory", './services/conditionFactory');
    app.modules.addClass("joinFactory", './services/joinFactory');

    // database system
    if (!config.database || !config.database.engine)
        throw "Missing/incomplete database configuration";
    if (config.database.engine === "mssql")
        app.modules.addClass("db", './adapters/db/mssqldb');
    else if (config.database.engine === "mysql")
        app.modules.addClass("db", './adapters/db/mysqldb');
    else
        throw "Unsupported database management system " + config.dbms;

    // storage system
    if (!!config.storage)
    {
        if (config.storage.provider  === "azure")
            app.modules.addClass("storage", './adapters/storage/azureStorage');
        else if (config.storage.provider  === "s3")
            app.modules.addClass("storage", './adapters/storage/s3Storage');
        else if (config.storage.provider  === "local")
            app.modules.addClass("storage", './adapters/storage/localHostStorage');
        else
            throw "Missing or unsupported storage system: " + config.storage.provider;
        app.modules.get("storage").initialize(config);
    }

    // monitoring system
    if (!!config.monitoring)
    {
        if (!!config.monitoring.appInsightsKey)
            applicationInsightsSetup(config.monitoring.appInsightsKey).start();
    }

    const ext:AppExtension = new AppExtension(app);
    app.setupApiEndpoints = () => ext.setupApiEndpoints();
    app.start = (p:number,cb:any) => ext.start(p,cb);
    app.findById = (or:any,e:string,i:string,cb:any) => ext.findById(or,e,i,cb);
    app.findAll = (or:any,e:string,o:string,s:number,t:number,cb:any) => ext.findAll(or,e,o,s,t,cb);
    app.findByCondition = (or:any,e:string,o:string,s:number,t:number,c:any,cb:any) => ext.findByCondition(or,e,o,s,t,c,cb);
    app.getDatabaseAdapter = () => ext.getDatabaseAdapter();
    app.getStorageAdapter = () => ext.getStorageAdapter();
    return app;
};

class AppExtension
{
    app:any;

    constructor(app:any)
    {
        this.app = app;
    }

    /**
     * Set up API endpoints
     * @param {any} app server application
     */
    setupApiEndpoints()
    {
        // log request details to console
        this.app.use("", (req:any, res:any, next:any) =>
        {
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
        this.app.use((err:any, req:any, res:any, next:any) =>
        {
            try
            {
                this.app.modules.get("exec").handleError(err, req, res, this.app.modules.get("db"));
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
     * @param {any} port optional port to start the app at
     * @param {any} callback optional callback function
     */
    start(port:number, callback:any)
    {
        const finalPort = port || process.env.PORT || 1337;
        const server = this.app.listen(finalPort, () => 
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
     * @param {any} originalReq original request context where app is called from
     * @param {any} entity target entity of the read operation
     * @param {any} id record id
     * @param {any} callback callback function
     */
    findById(originalReq:any, entity:string, id:string, callback:any)
    {
        this.verifyConfig();
        const params = { accessType: "public", id: id };
        this.executeDirectRead(originalReq, entity, params, true, callback);
    }

    /**
     * Find a record by condition
     * @param {any} originalReq original request context where app is called from
     * @param {any} entity target entity of the read operation
     * @param {any} orderByField field name to order the results by
     * @param {any} skip number of records to skip (for pagination)
     * @param {any} take number of records to take (for pagination)
     * @param {any} condition condition string
     * @param {any} callback callback function
     */
    findByCondition(originalReq:any, entity:string, orderByField:string, skip:number, take:number, condition:any, callback:any)
    {
        this.verifyConfig();
        const params = { accessType: "public", orderByField: orderByField, skip: skip, take: take, condition: condition };
        this.executeDirectRead(originalReq, entity, params, false, callback);
    }

    /**
     * Get all records for the specified entity
     * @param {any} originalReq original request context where app is called from
     * @param {any} entity target entity of the read operation
     * @param {any} orderByField field name to order the results by
     * @param {any} skip number of records to skip (for pagination)
     * @param {any} take number of records to take (for pagination)
     * @param {any} callback callback function
     */
    findAll(originalReq:any, entity:string, orderByField:string, skip:number, take:number, callback:any)
    {
        this.verifyConfig();
        const params = { accessType: "public", orderByField: orderByField, skip: skip, take: take };
        this.executeDirectRead(originalReq, entity, params, false, callback);
    }

    /**
     * Get the database adapter for app application
     * @returns database adapter module
     */
    getDatabaseAdapter()
    {
        return this.app.modules.get("db");
    }

    /**
     * Get the storage adapter for app application
     * @returns storage adapter module
     */
    getStorageAdapter() 
    {
        return this.app.modules.get("storage");
    }

    /**
     * Verify that config is properly set in context factory
     */
    verifyConfig()
    {
        if (!this.app.contextFactory.getConfig())
            throw "setConfig needs to be called before any other orion functions";
    }

    /**
     * Configure CRUD data endpoints for the given app
     */
    configureDataEndpoints()
    {
        this.app.use('/api/data/:entity', this.app.modules.get("body-parser").json());
        this.app.use('/api/data/:entity', this.app.modules.get("body-parser").urlencoded({ extended: true }));
        this.app.use('/api/data/:entity', (req:any, res:any, next:any) =>
        {
            req.context = this.app.contextFactory.create(req, res, req.params.entity);
            this.app.modules.get("auth").initUserContext(req.context);
            next();
        });

        // GET Endpoints
        this.app.get('/api/data/:entity/:accessType/findbyid/:id', (req:any, res:any) => 
        {
            this.app.modules.get("read").execute(req.context, req.params, true);
        });
        this.app.get('/api/data/:entity/:accessType/findbycondition/:orderByField/:skip/:take/:condition', (req:any, res:any) => 
        {
            this.app.modules.get("read").execute(req.context, req.params, false);
        });
        this.app.get('/api/data/:entity/:accessType/findall/:orderByField/:skip/:take', (req:any, res:any) => 
        {
            this.app.modules.get("read").execute(req.context, req.params, false);
        });

        // POST Endpoints
        this.app.post('/api/data/asset', (req:any, res:any) =>
        {
            this.app.modules.get("createAsset").execute(req.context, req);
        });

        this.app.post('/api/data/:entity', (req:any, res:any) =>
        {
            this.app.modules.get("create").execute(req.context, req.body);
        });

        // PUT Endpoints
        this.app.put('/api/data/:entity/:id', (req:any, res:any) =>
        {
            this.app.modules.get("update").execute(req.context, req.body, req.params.id);
        });

        // DELETE Endpoints
        this.app.delete('/api/data/asset/:id', (req:any, res:any) =>
        {
            this.app.modules.get("deleteAsset").execute(req.context, req.params.id);
        });

        this.app.delete('/api/data/:entity/:id', (req:any, res:any) =>
        {
            this.app.modules.get("delete").execute(req.context, req.params.id);
        });
    }

    /**
     * Configure authentication endpoints
     */
    configureAuthEndpoints()
    {
        this.app.use('/api/auth', this.app.modules.get("body-parser").json());
        this.app.use('/api/auth', (req:any, res:any, next:any) =>
        {
            req.context = this.app.contextFactory.create(req, res, "user");
            next();
        });
        this.app.post('/api/auth/token', (req:any, res:any) =>
        {
            this.app.modules.get("auth").generateLocalUserToken(req.context, req.body.username, req.body.password);
        });
        this.app.post('/api/auth/token/fb', (req:any, res:any) =>
        {
            this.app.modules.get("auth").processFbToken(req.context, req.body.fbtoken);
        });
    }

    /**
     * Configure utility endpoints
     */
    configureUtilityEndpoints()
    {
        // error logging
        this.app.use('/api/error', this.app.modules.get("body-parser").json());
        this.app.post('/api/error', (req:any, res:any) =>
        {
            const config = this.app.contextFactory.getConfig();
            if (!config)
            {
                throw { "tag": "13bf", "statusCode": 500, "msg": "missing config" };
            }
            const ctx = { req: req, res: res, config: config };
            this.app.modules.get("db").insert(
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
     * @param {any} originalReq origianl request context where the read operation is triggered
     * @param {any} entity target entity of the read operation
     * @param {any} params read action parameters
     * @param {any} isFullMode whether or not the read result should be returned in long form
     * @param {any} callback callback function
     */
    executeDirectRead(originalReq:any, entity:string, params:any, isFullMode:boolean, callback:any)
    {
        const res:any = {};
        res.status = (status:number) =>
        {
            if (status !== 200)
                res.statusCode = status;
            return res;
        };
        res.send = (data:any) =>
        {
            if (res.statusCode !== 200)
                callback({ status: res.statusCode, data: data });
            else
                callback(data);
        };
        res.json = res.send;

        const req:any = { method: "GET", originalUrl: originalReq.originalUrl };
        const context = this.app.contextFactory.create(req, res, entity);
        req.context = context;

        this.app.modules.get("read").execute(context, params, isFullMode);
    }
}
