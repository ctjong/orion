module.exports = 
{
    dependencies: ["azure", "multiparty", "exec", "guid", "mime", "helper", "db"],
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

        this.execute = function(ctx, req)
        {
            if(!ctx.userId) 
                throw new _this.error.Error("4f53", 401, "anonymous upload is not supported");
            _this.helper.validate(ctx, "create", _this.db, null, { "ownerid": ctx.userId }, function(resource, requestBody)
            {
                var blobService = _this.azure.createBlobService(ctx.config.storageConnectionString);
                var form = new (_this.multiparty.Form)();
                var isFileReceived = false;
                var responseString = null;
                var errorObj = null;
                form.on('part', function(stream) 
                {
                    _this.exec.safeExecute(ctx, function()
                    {
                        isFileReceived = true;
                        if (!stream.filename)
                            throw new _this.error.Error("ffce", 400, "submitted file is not a valid file");
                        var size = stream.byteCount - stream.byteOffset;
                        var name = _this.guid.raw() + stream.filename.substring(stream.filename.lastIndexOf("."));
                        blobService.createBlockBlobFromStream(ctx.config.storageContainerName, name, stream, size, 
                        {
                            contentSettings: { contentType: _this.mime.lookup(name) }
                        }, 
                        function(error) 
                        {
                            if(error) 
                            {
                                throw new _this.error.Error("d2d0", 500, "error while saving file to blob storage");
                            }
                            else
                            {
                                _this.db.insert(ctx, "asset", ["ownerid", "filename"], [ctx.userId, name], function(dbResponse)
                                {
                                    ctx.res.send(dbResponse[0].identity.toString());
                                });
                            }
                        });
                    });
                });
                form.on('progress', function(bytesReceived, bytesExpected)
                {
                    _this.exec.safeExecute(ctx, function()
                    {
                        if(!isFileReceived && bytesReceived >= bytesExpected)
                            throw new _this.error.Error("171d", 400, "file not received");
                    });
                });
                form.on('error', function(err)
                {
                    _this.exec.safeExecute(ctx, function()
                    {
                        throw new _this.error.Error("ead9", 500, "error while parsing form data");
                    });
                });
                form.parse(req);
            });
        };

        _construct();
    }
};