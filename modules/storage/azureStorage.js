/**
 * A module to handle file upload/delete on Azure Blob Storage
 */
module.exports = 
{
    dependencies: ["multiparty", "exec", "guid", "mime", "helper", "db"],
    Instance: function()
    {
        var _this = this;
        var storage;

        //----------------------------------------------
        // CONSTRUCTOR
        //----------------------------------------------

        function _construct()
        {
            storage = require("azure-storage");
        }

        //----------------------------------------------
        // PUBLIC
        //----------------------------------------------

        /**
         * Upload a file to Azure Blob Storage
         * @param {any} ctx Request context
         * @param {any} req Request object
         * @param {any} callback Callback function
         */
        function uploadFile(ctx, req, callback)
        {
            var blobService = storage.createBlobService(ctx.config.storage.azureStorageConnectionString);
            var form = new (_this.multiparty.Form)();
            var isFileReceived = false;
            form.on('part', function(stream) 
            {
                _this.exec.safeExecute(ctx, function()
                {
                    isFileReceived = true;
                    if (!stream.filename)
                        throw new _this.error.Error("ffce", 400, "submitted file is not a valid file");
                    var size = stream.byteCount - stream.byteOffset;
                    var name = _this.guid.raw() + stream.filename.substring(stream.filename.lastIndexOf("."));
                    blobService.createBlockBlobFromStream(ctx.config.storage.azureStorageContainerName, name, stream, size, 
                    {
                        contentSettings: { contentType: _this.mime.lookup(name) }
                    }, 
                    function(error) 
                    {
                        callback(error, name);
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
        };

        function deleteFile(ctx, filename, callback)
        {
            var blobService = storage.createBlobService(ctx.config.storage.azureStorageConnectionString);
            blobService.deleteBlob(ctx.config.storage.azureStorageContainerName, filename, function (error, response)
            {
                callback(error);
            });
        }

        this.uploadFile = uploadFile;
        this.deleteFile = deleteFile;
        _construct();
    }
};