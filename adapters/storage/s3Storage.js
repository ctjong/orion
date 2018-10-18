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
            if(!!provider || !config.storage.awsAccessKeyId || !config.storage.awsSecretAccessKey)
                return;
            const AWS = require("aws-sdk");
            provider = new AWS.S3(
            { 
                accessKeyId: config.storage.awsAccessKeyId, 
                secretAccessKey: config.storage.awsSecretAccessKey
            });
        }

        /**
         * Upload a file to Azure Blob Storage
         * @param {any} ctx Request context
         * @param {any} req Request object
         * @param {any} callback Callback function
         */
        function uploadFile(ctx, req, callback)
        {
            let isFirstPartReceived = false;
            const form = new (_this.multiparty.Form)(
            {
                autoFields: true
            });
            form.on('part', _this.exec.cb(ctx, function(stream) 
            {
                isFirstPartReceived = true;
                if (!stream.filename)
                    _this.exec.throwError("8dad", 400, "submitted file is not a valid file");
                const name = _this.guid() + stream.filename.substring(stream.filename.lastIndexOf("."));
                provider.upload(
                {
                    Bucket: ctx.config.storage.s3Bucket,
                    Key: name,
                    ACL: 'public-read',
                    Body: stream,
                    ContentLength: stream.byteCount,
                    ContentType: _this.mime.lookup(name)
                },
                _this.exec.cb(ctx, function(s3UploadErr, data)
                {
                    callback(s3UploadErr, name);
                }));
            }));
            form.on('progress', _this.exec.cb(ctx, function(bytesReceived, bytesExpected)
            {
                if(!isFirstPartReceived && bytesReceived >= bytesExpected)
                    _this.exec.sendErrorResponse(ctx, "49ef", 400, "error while parsing the first part");
            }));
            form.on('error', _this.exec.cb(ctx, function(err)
            {
                _this.exec.sendErrorResponse(ctx, "a95a", 400, "error while parsing form data");
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
            provider.deleteObject(
            {
                Key: filename,
                Bucket: ctx.config.storage.s3Bucket
            },
            function(error, data)
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