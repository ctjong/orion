/**
 * A module to handle file deletion operations
 */
module.exports = 
{
    dependencies: ["storage", "exec", "helper", "db"],
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
                _this.storage.deleteFile(ctx, resource.filename, function (error) 
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