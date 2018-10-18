/**
 * A module to handle file upload operations
 */
module.exports = 
{
    dependencies: ["storage", "helper", "db"],
    Instance: function()
    {
        const _this = this;

        //----------------------------------------------
        // CONSTRUCTOR
        //----------------------------------------------

        function _construct(){}

        //----------------------------------------------
        // PUBLIC
        //----------------------------------------------

        /**
         * Handle a create asset (file upload) request
         * @param {any} ctx Request context
         * @param {any} req Request object
         */
        function execute(ctx, req)
        {
            if (!ctx.config.storage)
                _this.exec.throwError("e668", 500, "file upload is not supported for this site");
            if(!ctx.userId) 
                _this.exec.throwError("4f53", 401, "anonymous upload is not supported");
            _this.helper.onBeginWriteRequest(ctx, "create", _this.db, null, { "ownerid": ctx.userId }, function(record, requestBody)
            {
                _this.storage.uploadFile(ctx, req, function (error, name) 
                {
                    if (error)
                    {
                        _this.exec.sendErrorResponse(ctx, "d2d0", 500, "error while uploading file to storage system");
                    }
                    else
                    {
                        _this.db.insert(ctx, "asset", ["ownerid", "filename"], [ctx.userId, name], function (insertedId)
                        {
                            ctx.res.send(insertedId.toString());
                        });
                    }
                });
            });
        }

        this.execute = execute;
        _construct();
    }
};