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

        this.execute = function(ctx, resourceId)
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
                        if(error) 
                        {
                            throw new _this.error.Error("aa4e", 400, "asset not found");
                        }
                        else
                        {
                            _this.db.deleteResource(ctx, "asset", resourceId, function(dbResponse)
                            { 
                                ctx.res.send(dbResponse);
                            });
                        }
                    });
                });
            });
        };

        _construct();
    }
};