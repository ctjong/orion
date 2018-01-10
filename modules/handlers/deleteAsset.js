/**
 * A module to handle file deletion operations
 */
module.exports = 
{
    dependencies: ["azure", "exec", "helper", "db"],
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
         * Handle a delete asset (file deletion) request
         * @param {any} ctx Request context
         * @param {any} resourceId Resource ID of the asset to delete
         */
        function execute (ctx, resourceId)
        {
            if(!ctx.userId)
                throw new _this.error.Error("2c74", 401, "anonymous asset deletion is not supported");
            _this.helper.onBeginWriteRequest(ctx, "delete", _this.db, resourceId, null, function(resource, requestBody)
            {
                var blobService = _this.azure.createBlobService(ctx.config.storageConnectionString);
                var responseString = null;
                var errorObj = null;
                blobService.deleteBlob(ctx.config.storageContainerName, resource.filename, function(error, response)
                {
                    _this.exec.safeExecute(ctx, function()
                    {
                        _this.db.deleteResource(ctx, "asset", resourceId, function(dbResponse)
                        { 
                            if (error)
                                ctx.res.send("Asset removed with error: " + error);
                            else
                                ctx.res.send("Asset removed");
                        });
                    });
                });
            });
        };

        this.execute = execute;
        _construct();
    }
};