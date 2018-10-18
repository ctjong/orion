/**
 * A module to handle file upload/delete on Azure Blob Storage
 */
module.exports = 
{
    dependencies: ["multiparty", "guid", "mime", "helper", "db"],
    Instance: function()
    {
        const _this = this;
        const path = require("path");
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
            if(!!provider)
                return;
            provider = require("fs");
        }

        /**
         * Upload a file to Azure Blob Storage
         * @param {any} ctx Request context
         * @param {any} req Request object
         * @param {any} callback Callback function
         */
        function uploadFile(ctx, req, callback)
        {
            const form = new (_this.multiparty.Form)(
            {
                autoFiles: true,
                uploadDir: ctx.config.storage.uploadPath
            });
            form.on('file', _this.exec.cb(ctx, function(name, file)
            {
                const tempPath = file.path;
                const tempName = path.basename(tempPath);
                const finalName = _this.guid() + tempName.substring(tempName.lastIndexOf("."));
                const finalPath = tempPath.replace(tempName, finalName);
                provider.rename(tempPath, finalPath, _this.exec.cb(ctx, function(error)
                {
                    callback(error, finalName);
                }));
            }));
            form.on('error', _this.exec.cb(ctx, function(err)
            {
                _this.exec.sendErrorResponse(ctx, "8651", 400, "error while parsing form data");
            }));
            form.parse(req);
        }

        /**
         * Delete a file from the storage
         * @param {*} ctx Request context
         * @param {*} filename File name to delete
         * @param {*} callback Callback function
         */
        function deleteFile(ctx, filename, callback)
        {
            const fullPath = ctx.config.storage.uploadPath + "/" + filename;
            provider.unlink(fullPath, function (error)
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