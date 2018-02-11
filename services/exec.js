/**
 * A module for handling the execution of code outside of the main thread.
 * This is to make sure exceptions are caught properly, even those coming from child threads.
 */
module.exports = 
{
    dependencies: [],
    Instance: function()
    {
        var _this = this;

        //----------------------------------------------
        // CONSTRUCTOR
        //----------------------------------------------

        function _construct(){}

        //----------------------------------------------
        // PUBLIC
        //----------------------------------------------

        /**
         * Handle an error.
         * This will log an error to the database, and send an error response.
         * @param {any} err Error object
         * @param {any} req Request object
         * @param {any} res Response object
         * @param {any} db Database module
         */
        function handleError(err, req, res, db) 
        {
            if(typeof(err) === "string")
            {
                err = _this.error.parse(err);
            }
            console.error(err);
            var config = !!req.context && !!req.context.config ? req.context.config : null;
            try
            {
                if(!!db && !!config)
                {
                    if(!err.tag) err.tag = "";
                    if(!err.statusCode) err.statusCode = 500;
                    if(!err.msg) err.msg = "";
                    if(!!err.stack) err.msg = err.stack.substring(0,255);
                    var ctx = {res: res, config: config};
                    var url = req.method + " " + req.originalUrl;
                    db.insert(
                        ctx, 
                        "error", 
                        ["tag", "statuscode", "msg", "url", "timestamp"], 
                        [err.tag, err.statusCode, err.msg, url, new Date().getTime()], 
                        function(){}, 
                        function()
                        {
                            res.status(err.statusCode).send(err.msg);
                        }
                    );
                }
                else
                {
                    res.status(err.statusCode).send(err.msg);
                }
            }
            catch(err3)
            {
                res.status(500).send(err.msg);
            }
        }

        /**
         * Execute the given function and catch any exception that comes out of it
         * @param {any} ctx Request context
         * @param {any} fn Function to execute
         */
        function safeExecute(ctx, fn)
        {
            try
            {
                fn();
            }
            catch(err)
            {
                _this.handleError(err, ctx.req, ctx.res);
            }
        }

        this.handleError = handleError;
        this.safeExecute = safeExecute;
        _construct();
    }
};