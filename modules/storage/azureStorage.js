/**
 * A module to handle file upload/delete on Azure Blob Storage
 */
module.exports = 
{
    dependencies: ["multiparty", "exec", "guid", "mime", "helper", "db"],
    Instance: function()
    {
        var _this = this;
        var adapter;

        //----------------------------------------------
        // CONSTRUCTOR
        //----------------------------------------------

        function _construct()
        {
            adapter = require("azure-storage");
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
            var blobService = adapter.createBlobService(ctx.config.storage.azureStorageConnectionString);
            var isFirstPartReceived = false;
            var form = new (_this.multiparty.Form)();
            form.on('part', function(stream) 
            {
                _this.exec.safeExecute(ctx, function()
                {
                    isFirstPartReceived = true;
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
                    if(!isFirstPartReceived && bytesReceived >= bytesExpected)
                        throw new _this.error.Error("171d", 400, "error while parsing the first part");
                });
            });
            form.on('error', function(err)
            {
                _this.exec.safeExecute(ctx, function()
                {
                    throw new _this.error.Error("ead9", 400, "error while parsing form data");
                });
            });
            form.parse(req);
        }

        /**
         * Delete a file from the storage
         * @param {*} ctx Request context 
         * @param {*} filename File name
         * @param {*} callback Callback function
         */
        function deleteFile(ctx, filename, callback)
        {
            var blobService = adapter.createBlobService(ctx.config.storage.azureStorageConnectionString);
            blobService.deleteBlob(ctx.config.storage.azureStorageContainerName, filename, function (error, response)
            {
                callback(error);
            });
        }

        /**
         * Set a mock adapter module for unit testing
         * @param {any} mockModule Mock module
         */
        function setMockAdapter(mockModule)
        {
            adapter = mockModule;
        }

        this.uploadFile = uploadFile;
        this.deleteFile = deleteFile;
        this.setMockAdapter = setMockAdapter;
        _construct();
    }
};