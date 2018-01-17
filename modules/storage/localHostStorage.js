/**
 * A module to handle file upload/delete on Azure Blob Storage
 */
module.exports = 
{
    dependencies: ["multiparty", "exec", "guid", "mime", "helper", "db"],
    Instance: function()
    {
        var _this = this;
        var fs;

        //----------------------------------------------
        // CONSTRUCTOR
        //----------------------------------------------

        function _construct()
        {
            fs = require("fs");
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
            var isFirstPartReceived = false;
            var form = new (_this.multiparty.Form)(
            {
                autoFiles: true,
                uploadPath: ctx.config.storage.uploadPath
            });
            form.on('file', function(name, file)
            {
                _this.exec.safeExecute(ctx, function()
                {
                    isFirstPartReceived = true;
                    var tempName = file.originalFilename;
                    var finalName = _this.guid.raw() + tempName.substring(tempName.lastIndexOf("."));
                    var tempPath = file.path;
                    var finalPath = tempPath.replace(tempName, finalName);
                    fs.rename(tempPath, finalPath, function(error)
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
                        throw new _this.error.Error("0ae5", 400, "file not received");
                });
            });
            form.on('error', function(err)
            {
                _this.exec.safeExecute(ctx, function()
                {
                    throw new _this.error.Error("8651", 500, "error while parsing form data");
                });
            });
            form.parse(req);
        };

        /**
         * Delete a file from the storage
         * @param {*} ctx Request context
         * @param {*} filename File name to delete
         * @param {*} callback Callback function
         */
        function deleteFile(ctx, filename, callback)
        {
            var fullPath = ctx.config.storage.uploadPath + "/" + filename;
            fs.unlink(fullPath, function (error)
            {
                callback(error);
            });
        }

        this.uploadFile = uploadFile;
        this.deleteFile = deleteFile;
        _construct();
    }
};