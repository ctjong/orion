import * as Express from "express";
import { Config, Context } from "./types";
import { contextFactory } from "./services/contextFactory";
import * as applicationInsights from "applicationinsights";
import { dataService } from "./services/dataService";
import * as bodyParser from "body-parser";
import { execService } from "./services/execService";
import { authService } from "./services/authService";
import { createAssetHandler } from "./handlers/createAssetHandler";
import { createHandler } from "./handlers/createHandler";
import { deleteHandler } from "./handlers/deleteHandler";
import { deleteAssetHandler } from "./handlers/deleteAssetHandler";
import { readHandler } from "./handlers/readHandler";
import { updateHandler } from "./handlers/updateHandler";

/**
 * An Orion app object
 */
export default class Orion 
{
    app:Express.Express = null;
    express:any = Express;

    /**
     * Construct an Orion app
     * @param config configuration object
     */
    constructor(config:Config)
    {
        this.app = Express();

        // initialize components
        contextFactory.initializeConfig(config);
        dataService.initialize(config);

        // setup monitoring
        if (config.monitoring)
        {
            if (config.monitoring.appInsightsKey)
                applicationInsights.setup(config.monitoring.appInsightsKey).start();
        }
    }

    /**
     * Set up API endpoints
     */
    setupApiEndpoints(): void
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
                execService.handleError(err, req, res, dataService.db);
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
     * @param port optional port to start the app at
     * @returns server object
     */
    start(port:number): Promise<any>
    {
        return new Promise(resolve =>
        {
            const finalPort = port || process.env.PORT || 1337;
            const server = this.app.listen(finalPort, () => 
            {
                const addr:any = server.address();
                const host = addr.address;
                const port = addr.port;
                console.log("Listening at http://%s:%s", host, port);
                resolve(server);
            });
        });
    }

    /**
     * Find a record by id
     * @param originalReq original request context where app is called from
     * @param entity target entity of the read operation
     * @param id record id
     * @returns query results
     */
    findById(originalReq:any, entity:string, id:string): Promise<any>
    {
        this.verifyConfig();
        const params = { accessType: "public", id: id };
        return this.executeDirectRead(originalReq, entity, params, true);
    }

    /**
     * Find a record by condition
     * @param originalReq original request context where app is called from
     * @param entity target entity of the read operation
     * @param orderByField field name to order the results by
     * @param skip number of records to skip (for pagination)
     * @param take number of records to take (for pagination)
     * @param condition condition string
     * @returns query results
     */
    findByCondition(originalReq:any, entity:string, orderByField:string, skip:number, take:number, condition:any): Promise<any>
    {
        this.verifyConfig();
        const params = { accessType: "public", orderByField: orderByField, skip: skip, take: take, condition: condition };
        return this.executeDirectRead(originalReq, entity, params, false);
    }

    /**
     * Get all records for the specified entity
     * @param originalReq original request context where app is called from
     * @param entity target entity of the read operation
     * @param orderByField field name to order the results by
     * @param skip number of records to skip (for pagination)
     * @param take number of records to take (for pagination)
     * @returns query results
     */
    findAll(originalReq:any, entity:string, orderByField:string, skip:number, take:number): Promise<any>
    {
        this.verifyConfig();
        const params = { accessType: "public", orderByField: orderByField, skip: skip, take: take };
        return this.executeDirectRead(originalReq, entity, params, false);
    }

    /**
     * Get the database adapter for app application
     * @returns database adapter module
     */
    getDatabaseAdapter(): any
    {
        return dataService.db;
    }

    /**
     * Get the storage adapter for app application
     * @returns storage adapter module
     */
    getStorageAdapter(): any
    {
        return dataService.storage;
    }

    /**
     * Verify that config is properly set in context factory
     */
    verifyConfig(): void
    {
        if (!contextFactory.config)
            throw "setConfig needs to be called before any other orion functions";
    }

    /**
     * Configure CRUD data endpoints for the given app
     */
    configureDataEndpoints(): void
    {
        this.app.use('/api/data/:entity', bodyParser.json());
        this.app.use('/api/data/:entity', bodyParser.urlencoded({ extended: true }));
        this.app.use('/api/data/:entity', (req:any, res:any, next:any) =>
        {
            req.context = contextFactory.create(req, res, req.params.entity);
            authService.initUserContext(req.context);
            next();
        });

        // GET Endpoints
        this.app.get('/api/data/:entity/:accessType/findbyid/:id', (req:any, res:any) => 
        {
            readHandler.execute(req.context, req.params, true);
        });
        this.app.get('/api/data/:entity/:accessType/findbycondition/:orderByField/:skip/:take/:condition', (req:any, res:any) => 
        {
            readHandler.execute(req.context, req.params, false);
        });
        this.app.get('/api/data/:entity/:accessType/findall/:orderByField/:skip/:take', (req:any, res:any) => 
        {
            readHandler.execute(req.context, req.params, false);
        });

        // POST Endpoints
        this.app.post('/api/data/asset', (req:any, res:any) =>
        {
            createAssetHandler.execute(req.context, req);
        });

        this.app.post('/api/data/:entity', (req:any, res:any) =>
        {
            createHandler.execute(req.context, req.body);
        });

        // PUT Endpoints
        this.app.put('/api/data/:entity/:id', (req:any, res:any) =>
        {
            updateHandler.execute(req.context, req.body, req.params.id);
        });

        // DELETE Endpoints
        this.app.delete('/api/data/asset/:id', (req:any, res:any) =>
        {
            deleteAssetHandler.execute(req.context, req.params.id);
        });

        this.app.delete('/api/data/:entity/:id', (req:any, res:any) =>
        {
            deleteHandler.execute(req.context, req.params.id);
        });
    }

    /**
     * Configure authentication endpoints
     */
    configureAuthEndpoints(): void
    {
        this.app.use('/api/auth', bodyParser.json());
        this.app.use('/api/auth', (req:any, res:any, next:any) =>
        {
            req.context = contextFactory.create(req, res, "user");
            next();
        });
        this.app.post('/api/auth/token', (req:any, res:any) =>
        {
            authService.generateLocalUserToken(req.context, req.body.username, req.body.password);
        });
        this.app.post('/api/auth/token/fb', (req:any, res:any) =>
        {
            authService.processFbToken(req.context, req.body.fbtoken);
        });
    }

    /**
     * Configure utility endpoints
     */
    configureUtilityEndpoints(): void
    {
        // error logging
        this.app.use('/api/error', bodyParser.json());
        this.app.post('/api/error', (req:any, res:any) =>
        {
            const config = contextFactory.config;
            if (!config)
            {
                throw { "tag": "13bf", "statusCode": 500, "msg": "missing config" };
            }
            const ctx:Context = { req: req, res: res, config: config };
            dataService.db.insert(
                ctx,
                "error",
                ["tag", "statuscode", "msg", "url", "timestamp"],
                ["48a4", "000", req.body.msg, "POST /error", new Date().getTime()]
            );
        });
    }

    /**
     * Execute a direct read operation, a read operation that is triggered from the server.
     * @param originalReq origianl request context where the read operation is triggered
     * @param entity target entity of the read operation
     * @param params read action parameters
     * @param isFullMode whether or not the read result should be returned in long form
     */
    executeDirectRead(originalReq:any, entity:string, params:any, isFullMode:boolean): Promise<any>
    {
        return new Promise(resolve =>
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
                    resolve({ status: res.statusCode, data: data });
                else
                    resolve(data);
            };
            res.json = res.send;

            const req:any = { method: "GET", originalUrl: originalReq.originalUrl };
            const context = contextFactory.create(req, res, entity);
            req.context = context;

            readHandler.execute(context, params, isFullMode);
        });
    }
}
