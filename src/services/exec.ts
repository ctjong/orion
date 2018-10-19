// const Module = require("../module");

// /**
//  * A module for handling the execution of code outside of the main thread.
//  * This is to make sure exceptions are caught properly, even those coming from child threads.
//  */
// module.exports = class ExecService extends Module
// {
//     /**
//      * Get a list of dependency names for this module
//      */
//     getDependencyNames()
//     {
//         return [];
//     }

//     /**
//      * Handle an error.
//      * This will log an error to the database, and send an error response.
//      * @param {any} err Error object
//      * @param {any} req Request object
//      * @param {any} res Response object
//      * @param {any} db Database module
//      */
//     handleError(err, req, res, db) 
//     {
//         if(typeof(err) === "string")
//         {
//             err = parseError(err);
//         }
//         console.error(err);
//         const config = !!req.context && !!req.context.config ? req.context.config : null;
//         try
//         {
//             if(!!db && !!config)
//             {
//                 if(!err.tag) err.tag = "";
//                 if(!err.statusCode) err.statusCode = 500;
//                 if(!err.msg) err.msg = "";
//                 if(!!err.stack) err.msg = err.stack.substring(0,255);
//                 const ctx = {res: res, config: config};
//                 const url = req.method + " " + req.originalUrl;
//                 db.insert(
//                     ctx, 
//                     "error", 
//                     ["tag", "statuscode", "msg", "url", "timestamp"], 
//                     [err.tag, err.statusCode, err.msg, url, new Date().getTime()], 
//                     function(){}, 
//                     function()
//                     {
//                         try
//                         {
//                             res.status(err.statusCode).send(err.msg);
//                         } catch(err5) {}
//                     }
//                 );
//             }
//             else
//             {
//                 res.status(err.statusCode).send(err.msg);
//             }
//         }
//         catch(err3)
//         {
//             try
//             {
//                 res.status(500).send(err.msg);
//             } catch(err4) {}
//         }
//     }

//     /**
//      * Execute a callback and catch any exception that comes out of it.
//      * Any callback that is being passed to a library function should be wrapped in this.
//      * @param {any} ctx Request context
//      * @param {any} fn Callback function to execute
//      */
//     cb(ctx, fn)
//     {
//         return (...args) =>
//         {
//             try
//             {
//                 fn.apply(null, ...args);
//             }
//             catch(err)
//             {
//                 this.handleError(err, ctx.req, ctx.res);
//             }
//         }
//     }

//     /**
//      * Throw an Error object up the call stack
//      */
//     throwError(tag, statusCode, msg)
//     {
//         throw new Error(tag, statusCode, msg);
//     }

//     /**
//      * Send an error response
//      */
//     sendErrorResponse(ctx, tag, statusCode, msg)
//     {
//         this.handleError(new Error(tag, statusCode, msg), ctx.req, ctx.res);
//     }
// }


// //----------------------------------------------
// // PPRIVATE
// //----------------------------------------------

// /**
//  * Construct a new Error object. This will contain all details about an error.
//  */
// class Error
// {
//     constructor(tag, statusCode, msg)
//     {
//         this.tag = tag;
//         this.statusCode = statusCode;
//         this.msg = msg;
//     }
// }

// /**
//  * Parse an error string and construct a new Error object.
//  */
// const parseError = (errorStr) =>
// {
//     return new Error("", 500, errorStr);
// }