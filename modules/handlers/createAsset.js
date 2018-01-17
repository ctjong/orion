/**
 * A module to handle file upload operations
 */
module.exports = 
{
    dependencies: ["storage", "helper", "db"],
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
         * Handle a create asset (file upload) request
         * @param {any} ctx Request context
         * @param {any} req Request object
         */
        function execute(ctx, req)
        {
            if (!ctx.config.storage)
                throw new _this.error.Error("e668", 500, "file upload is not supported for this site");
            if(!ctx.userId) 
                throw new _this.error.Error("4f53", 401, "anonymous upload is not supported");
            _this.helper.onBeginWriteRequest(ctx, "create", _this.db, null, { "ownerid": ctx.userId }, function(resource, requestBody)
            {
                _this.storage.uploadFile(ctx, req, function (error, name) 
                {
                    if (error)
                    {
                        throw new _this.error.Error("d2d0", 500, "error while uploading file to storage system");
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
        };

        this.execute = execute;
        _construct();
    }
};