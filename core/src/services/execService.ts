import { Context } from "../types";
import { Database } from "../database";

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
     */
    async handleError(err: any, req: any, res: any, db?: Database)
    {
        if (typeof (err) === "string")
        {
            err = Error.parse(err);
        }
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

                const ctx: Context = { req: null, res: res, config: config };
                const url = req.method + " " + req.originalUrl;
                await db.insert(
                    ctx,
                    "error",
                    ["tag", "statuscode", "msg", "url", "timestamp"],
                    [err.tag, err.statusCode, err.msg, url, new Date().getTime()]);

                try
                {
                    res.status(err.statusCode).send(err.msg);
                }
                catch (err2) 
                {
                }
            }
            else
            {
                res.status(err.statusCode).send(err.msg);
            }
        }
        catch (err3)
        {
            try
            {
                res.status(500).send(err.msg);
            } catch (err4) { }
        }
    }

    /**
     * Execute a callback and catch any exception that comes out of it.
     * Any callback that is being passed to a library function should be wrapped in this.
     * @param ctx request context
     * @param fn function to execute
     */
    async catchAllErrors(ctx: Context, fn: ((...args: any) => any))
    {
        try
        {
            const retVal = fn.call(null);
            if(retVal instanceof Promise)
                await retVal;
        }
        catch (err)
        {
            this.handleError(err, ctx.req, ctx.res);
        }
    }

    /**
     * Throw an Error object up the call stack
     * @param tag error tag
     * @param statusCode response status code
     * @param msg error message
     */
    throwError(tag: string, statusCode: number, msg: string)
    {
        throw new Error(tag, statusCode, msg);
    }

    /**
     * Send an error response
     * @param ctx request context
     * @param tag error tag
     * @param statusCode response status code
     * @param msg error message
     */
    sendErrorResponse(ctx: Context, tag: string, statusCode: number, msg: string)
    {
        this.handleError(new Error(tag, statusCode, msg), ctx.req, ctx.res);
    }
}

/**
 * Construct a new Error object. This will contain all details about an error.
 */
export class Error
{
    tag: string;
    statusCode: number;
    msg: string;

    constructor(tag: string, statusCode: number, msg: string)
    {
        this.tag = tag;
        this.statusCode = statusCode;
        this.msg = msg;
    }

    static parse(errorStr: string): Error
    {
        return new Error("", 500, errorStr);
    }
}

const execService = new ExecService();
export { execService };