/**
 * A module to handle file upload/delete on Azure Blob Storage
 */
module.exports = 
{
    dependencies: ["multiparty", "exec", "guid", "mime", "helper", "db"],
    Instance: function()
    {
        var _this = this;
        var s3 = null;

        //----------------------------------------------
        // CONSTRUCTOR
        //----------------------------------------------

        function _construct() { }

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
            initS3(ctx);
            var isFirstPartReceived = false;
            var form = new (_this.multiparty.Form)(
            {
                autoFields: true
            });
            form.on('part', function(stream) 
            {
                _this.exec.safeExecute(ctx, function()
                {
                    isFirstPartReceived = true;
                    if (!stream.filename)
                        throw new _this.error.Error("8dad", 400, "submitted file is not a valid file");
                    var name = _this.guid.raw() + stream.filename.substring(stream.filename.lastIndexOf("."));
                    s3.upload(
                    {
                        Bucket: ctx.config.storage.s3Bucket,
                        Key: name,
                        ACL: 'public-read',
                        Body: stream,
                        ContentLength: stream.byteCount,
                        ContentType: _this.mime.lookup(name)
                    },
                    function(s3UploadErr, data)
                    {
                        callback(s3UploadErr, name);
                    });
                });
            });
            form.on('progress', function(bytesReceived, bytesExpected)
            {
                _this.exec.safeExecute(ctx, function()
                {
                    if(!isFirstPartReceived && bytesReceived >= bytesExpected)
                        throw new _this.error.Error("49ef", 400, "error while parsing the first part");
                });
            });
            form.on('error', function(err)
            {
                _this.exec.safeExecute(ctx, function()
                {
                    throw new _this.error.Error("a95a", 400, "error while parsing form data");
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
            initS3(ctx);
            s3.deleteObject(
            {
                Key: filename,
                Bucket: ctx.config.storage.s3Bucket
            },
            function(error, data)
            {
                callback(error);
            });
        }

        //----------------------------------------------
        // PRIVATE
        //----------------------------------------------

        /**
         * Initialize the S3 module if it is not set up yet
         * @param {*} ctx Request context
         */
        function initS3(ctx)
        {
            if(!!s3)
                return;
            var AWS = require("aws-sdk");
            s3 = new AWS.S3(
            { 
                accessKeyId: ctx.config.storage.awsAccessKeyId, 
                secretAccessKey: ctx.config.storage.awsSecretAccessKey
            });
        }

        this.uploadFile = uploadFile;
        this.deleteFile = deleteFile;
        _construct();
    }
};