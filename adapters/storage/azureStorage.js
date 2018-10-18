/**
 * A module to handle file upload/delete on Azure Blob Storage
 */
module.exports = 
{
    dependencies: ["multiparty", "guid", "mime", "helper", "db"],
    Instance: function()
    {
        const _this = this;
        let provider = null;

        //----------------------------------------------
        // CONSTRUCTOR
        //----------------------------------------------

        function _construct() { }

        //----------------------------------------------
        // PUBLIC
        //----------------------------------------------

        /**
         * Initialize the adapter
         */
        function initialize(config)
        {
            if(!!provider || !config.storage.azureStorageConnectionString)
                return;
            const azure = require("azure-storage");
            provider = azure.createBlobService(config.storage.azureStorageConnectionString);
        }

        /**
         * Upload a file to Azure Blob Storage
         * @param {any} ctx Request context
         * @param {any} req Request object
         * @param {any} callback Callback function
         */
        function uploadFile(ctx, req, callback)
        {
            const isFirstPartReceived = false;
            const form = new (_this.multiparty.Form)();
            form.on('part', _this.exec.cb(ctx, function (stream) 
            {
                isFirstPartReceived = true;
                if (!stream.filename)
                    _this.exec.throwError("ffce", 400, "submitted file is not a valid file");
                const size = stream.byteCount - stream.byteOffset;
                const name = _this.guid() + stream.filename.substring(stream.filename.lastIndexOf("."));
                provider.createBlockBlobFromStream(ctx.config.storage.azureStorageContainerName, name, stream, size, 
                {
                    contentSettings: { contentType: _this.mime.lookup(name) }
                },
                _this.exec.cb(ctx, function(error)
                {
                    callback(error, name);
                }));
            }));
            form.on('progress', _this.exec.cb(ctx, function(bytesReceived, bytesExpected)
            {
                if(!isFirstPartReceived && bytesReceived >= bytesExpected)
                    _this.exec.sendErrorResponse(ctx, "171d", 400, "error while parsing the first part");
            }));
            form.on('error', _this.exec.cb(ctx, function(err)
            {
                _this.exec.sendErrorResponse(ctx, "ead9", 400, "error while parsing form data");
            }));
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
            provider.deleteBlob(ctx.config.storage.azureStorageContainerName, filename, function (error, response)
            {
                callback(error);
            });
        }

        /**
         * Set the provider module for this adapter
         * @param {any} providerModule provider module
         */
        function setProvider(providerModule)
        {
            provider = providerModule;
        }

        this.initialize = initialize;
        this.uploadFile = uploadFile;
        this.deleteFile = deleteFile;
        this.setProvider = setProvider;
        _construct();
    }
};