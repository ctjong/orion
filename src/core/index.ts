import * as Express from "express";
import { Config, Error } from "./types";
import { ContextFactory } from "./services/contextFactory";
import * as applicationInsights from "applicationinsights";
import * as bodyParser from "body-parser";
import { execService } from "./services/execService";
import { authService } from "./services/authService";
import { createAssetHandler } from "./handlers/createAssetHandler";
import { createHandler } from "./handlers/createHandler";
import { deleteHandler } from "./handlers/deleteHandler";
import { deleteAssetHandler } from "./handlers/deleteAssetHandler";
import { readHandler } from "./handlers/readHandler";
import { updateHandler } from "./handlers/updateHandler";
import { Database } from "./database";
import { Storage } from "./storage";
import { AzureStorage } from "./adapters/storage/azureStorage";
import { S3Storage } from "./adapters/storage/s3Storage";
import { LocalHostStorage } from "./adapters/storage/localHostStorage";
import { MssqlDatabase } from "./adapters/db/mssqlDatabase";
import { MysqlDatabase } from "./adapters/db/mysqlDatabase";

/**
 * An Orion app object
 */
export default class Orion 
{
    app:Express.Express = null;
    express:any = Express;
    db:Database = null;
    storage:Storage = null;
    contextFactory:ContextFactory = null;

    /**
     * Construct an Orion app
     * @param config configuration object
     * @param databaseAdapter optional database adapter module. See this link for more details
     * on what the database adapter's requirements are:
     * https://github.com/ctjong/orion/blob/master/src/core/database.ts
     * @param storageAdapter optional storage adapter module. See this link for more details
     * on what the storage adapter's requirements are:
     * https://github.com/ctjong/orion/blob/master/src/core/storage.ts
     */
    constructor(config:Config, databaseAdapter?:Database, storageAdapter?: Storage)
    {
        this.app = Express();
        this.contextFactory = new ContextFactory(config);

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

        // setup monitoring
        if (config.monitoring && config.monitoring.appInsightsKey)
            applicationInsights.setup(config.monitoring.appInsightsKey).start();
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
                execService.handleErrorAsync(err, req, res, this.db);
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
    startAsync(port:number): Promise<any>
    {
        return new Promise(resolve =>
        {
            // We are not using "!port" for the null check because we want 
            // to allow the value 0.
            if(port === null || typeof port === "undefined")
                port = parseInt(process.env.PORT);
            if(port === null || typeof port === "undefined")
                port = 1337

            const server = this.app.listen(port, () => 
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
    findByIdAsync(originalReq:any, entity:string, id:string): Promise<any>
    {
        const params = { accessType: "public", id: id };
        return this.executeDirectReadAsync(originalReq, entity, params, true);
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
    findByConditionAsync(originalReq:any, entity:string, orderByField:string, skip:number, take:number, condition:any): Promise<any>
    {
        const params = { accessType: "public", orderByField: orderByField, skip: skip, take: take, condition: condition };
        return this.executeDirectReadAsync(originalReq, entity, params, false);
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
    findAllAsync(originalReq:any, entity:string, orderByField:string, skip:number, take:number): Promise<any>
    {
        const params = { accessType: "public", orderByField: orderByField, skip: skip, take: take };
        return this.executeDirectReadAsync(originalReq, entity, params, false);
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
            req.context = this.contextFactory.create(req, res, req.params.entity, this.db, this.storage);
            authService.initUserContext(req.context);
            next();
        });

        // GET Endpoints
        this.app.get('/api/data/:entity/:accessType/findbyid/:id', async (req:any, res:any) => 
        {
            await readHandler.executeAsync(req.context, req.params, true).catch(err => execService.handleErrorAsync(err, req, res, this.db));
        });
        this.app.get('/api/data/:entity/:accessType/findbycondition/:orderByField/:skip/:take/:condition', async (req:any, res:any) => 
        {
            await readHandler.executeAsync(req.context, req.params, false).catch(err => execService.handleErrorAsync(err, req, res, this.db));
        });
        this.app.get('/api/data/:entity/:accessType/findall/:orderByField/:skip/:take', async (req:any, res:any) => 
        {
            await readHandler.executeAsync(req.context, req.params, false).catch(err => execService.handleErrorAsync(err, req, res, this.db));
        });

        // POST Endpoints
        this.app.post('/api/data/asset', async (req:any, res:any) =>
        {
            await createAssetHandler.executeAsync(req.context, req).catch(err => execService.handleErrorAsync(err, req, res, this.db));
        });

        this.app.post('/api/data/:entity', async (req:any, res:any) =>
        {
            await createHandler.executeAsync(req.context, req.body).catch(err => execService.handleErrorAsync(err, req, res, this.db));
        });

        // PUT Endpoints
        this.app.put('/api/data/:entity/:id', async (req:any, res:any) =>
        {
            await updateHandler.executeAsync(req.context, req.body, req.params.id).catch(err => execService.handleErrorAsync(err, req, res, this.db));
        });

        // DELETE Endpoints
        this.app.delete('/api/data/asset/:id', async (req:any, res:any) =>
        {
            await deleteAssetHandler.executeAsync(req.context, req.params.id).catch(err => execService.handleErrorAsync(err, req, res, this.db));
        });

        this.app.delete('/api/data/:entity/:id', async (req:any, res:any) =>
        {
            await deleteHandler.executeAsync(req.context, req.params.id).catch(err => execService.handleErrorAsync(err, req, res, this.db));
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
            req.context = this.contextFactory.create(req, res, "user", this.db, this.storage);
            next();
        });
        this.app.post('/api/auth/token', async (req:any, res:any) =>
        {
            await authService.generateLocalUserTokenAsync(req.context, req.body.username, req.body.password);
        });
        this.app.post('/api/auth/token/fb', async (req:any, res:any) =>
        {
            await authService.processFbTokenAsync(req.context, req.body.fbtoken);
        });
    }

    /**
     * Configure utility endpoints
     */
    configureUtilityEndpoints(): void
    {
        // error logging
        this.app.use('/api/error', bodyParser.json());
        this.app.post('/api/error', async (req:any, res:any) =>
        {
            req.context = { req:req, res:res, entity:"error", db:this.db, storage:null };
            const err:Error = { tag: "48a4", statusCode: 500, "msg": req.body.msg };
            await execService.handleErrorAsync(err, req, res, this.db);
        });
    }

    /**
     * Execute a direct read operation, a read operation that is triggered from the server.
     * @param originalReq origianl request context where the read operation is triggered
     * @param entity target entity of the read operation
     * @param params read action parameters
     * @param isFullMode whether or not the read result should be returned in long form
     */
    async executeDirectReadAsync(originalReq:any, entity:string, params:any, isFullMode:boolean): Promise<any>
    {
        let response:any = null;
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
                response = { status: res.statusCode, data: data };
            else
                response = data;
        };
        res.json = res.send;

        const req:any = { method: "GET", originalUrl: originalReq.originalUrl };
        const context = this.contextFactory.create(req, res, entity, this.db, this.storage);
        req.context = context;

        await readHandler.executeAsync(context, params, isFullMode).catch(err => execService.handleErrorAsync(err, req, res, this.db));
        return response;
    }
}
