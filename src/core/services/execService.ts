import { Context, Error } from "../types";
import { IDatabase } from "../idatabase";

/**
 * A module for handling the execution of code outside of the main thread.
 * This is to make sure exceptions are caught properly, even those coming from child threads.
 */
export class ExecService
{
    /**
     * Handle an error.
     * This will log an error to the database, and send an error response.
     * @param err Error object
     * @param req Request object
     * @param res Response object
     * @param db Database module
     * @param suppressResponse Whether or not this should suppress response
     */
    async handleErrorAsync(errObj:Error|string, req:any, res:any, db?:IDatabase, suppressResponse?:boolean): Promise<void>
    {
        let err:Error = typeof errObj === "string" ? this.parseError(errObj) : errObj;
        console.error(err);

        const config = req.context && req.context.config ? req.context.config : null;

        try
        {
            if (db && config)
            {
                if (!err.tag)
                    err.tag = "";
                if (!err.statusCode)
                    err.statusCode = 500;
                if (!err.msg)
                    err.msg = "";
                if (err.stack)
                    err.msg = err.stack.substring(0, 255);

                const ctx:Context = { req: null, res: res, config: config, db:db, storage:null };
                const url = req.method + " " + req.originalUrl;
                await db.insertAsync(
                    ctx,
                    "error",
                    ["tag", "statuscode", "msg", "url", "timestamp"],
                    [err.tag, err.statusCode.toString(), err.msg, url, new Date().getTime().toString()]);
            }
        }
        catch (err)
        {
            err.statusCode = 500;
        }

        if (suppressResponse)
            return;
        try
        {
            res.status(err.statusCode).send(err.msg);
        }
        catch (err) 
        {
        }
    }

    /**
     * Execute a callback and catch any exception that comes out of it.
     * Any callback that is executed after a library call should be wrapped in this, to make sure
     * all exceptions that are thrown on a separate thread are caught.
     * @param ctx request context
     * @param fn function to execute
     */
    async catchAllErrorsAsync(ctx: Context, fn: (() => any)): Promise<void>
    {
        try
        {
            const retVal = fn.call(null);
            if(retVal instanceof Promise)
                await retVal;
        }
        catch (err)
        {
            this.handleErrorAsync(err, ctx.req, ctx.res);
        }
    }

    /**
     * Throw an Error object up the call stack
     * @param tag error tag
     * @param statusCode response status code
     * @param msg error message
     */
    throwError(tag: string, statusCode: number, msg: string): never
    {
        throw { tag, statusCode, msg };
    }

    /**
     * Send an error response
     * @param ctx request context
     * @param tag error tag
     * @param statusCode response status code
     * @param msg error message
     */
    sendErrorResponse(ctx: Context, tag: string, statusCode: number, msg: string): void
    {
        this.handleErrorAsync({ tag, statusCode, msg }, ctx.req, ctx.res);
    }

    /**
     * Create an error object from an error string
     * @param errorStr error string
     */
    parseError(errorStr: string): Error
    {
        return { tag:"", statusCode:500, msg:errorStr };
    }
}

const execService = new ExecService();
export { execService };