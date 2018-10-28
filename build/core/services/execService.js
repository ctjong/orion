"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A module for handling the execution of code outside of the main thread.
 * This is to make sure exceptions are caught properly, even those coming from child threads.
 */
class ExecService {
    /**
     * Handle an error.
     * This will log an error to the database, and send an error response.
     * @param err Error object
     * @param req Request object
     * @param res Response object
     * @param db Database module
     */
    handleError(err, req, res, db) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof (err) === "string") {
                err = Error.parse(err);
            }
            console.error(err);
            const config = req.context && req.context.config ? req.context.config : null;
            try {
                if (db && config) {
                    if (!err.tag)
                        err.tag = "";
                    if (!err.statusCode)
                        err.statusCode = 500;
                    if (!err.msg)
                        err.msg = "";
                    if (err.stack)
                        err.msg = err.stack.substring(0, 255);
                    const ctx = { req: null, res: res, config: config };
                    const url = req.method + " " + req.originalUrl;
                    yield db.insert(ctx, "error", ["tag", "statuscode", "msg", "url", "timestamp"], [err.tag, err.statusCode, err.msg, url, new Date().getTime()]);
                    try {
                        res.status(err.statusCode).send(err.msg);
                    }
                    catch (err2) {
                    }
                }
                else {
                    res.status(err.statusCode).send(err.msg);
                }
            }
            catch (err3) {
                try {
                    res.status(500).send(err.msg);
                }
                catch (err4) { }
            }
        });
    }
    /**
     * Execute a callback and catch any exception that comes out of it.
     * Any callback that is executed after a library call should be wrapped in this, to make sure
     * all exceptions that are thrown on a separate thread are caught.
     * @param ctx request context
     * @param fn function to execute
     */
    catchAllErrors(ctx, fn) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const retVal = fn.call(null);
                if (retVal instanceof Promise)
                    yield retVal;
            }
            catch (err) {
                this.handleError(err, ctx.req, ctx.res);
            }
        });
    }
    /**
     * Throw an Error object up the call stack
     * @param tag error tag
     * @param statusCode response status code
     * @param msg error message
     */
    throwError(tag, statusCode, msg) {
        throw new Error(tag, statusCode, msg);
    }
    /**
     * Send an error response
     * @param ctx request context
     * @param tag error tag
     * @param statusCode response status code
     * @param msg error message
     */
    sendErrorResponse(ctx, tag, statusCode, msg) {
        this.handleError(new Error(tag, statusCode, msg), ctx.req, ctx.res);
    }
}
exports.ExecService = ExecService;
/**
 * Construct a new Error object. This will contain all details about an error.
 */
class Error {
    constructor(tag, statusCode, msg) {
        this.tag = tag;
        this.statusCode = statusCode;
        this.msg = msg;
    }
    static parse(errorStr) {
        return new Error("", 500, errorStr);
    }
}
exports.Error = Error;
const execService = new ExecService();
exports.execService = execService;
