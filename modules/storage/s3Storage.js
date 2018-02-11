/**
 * A module to handle file upload/delete on Azure Blob Storage
 */
module.exports = 
{
    dependencies: ["multiparty", "exec", "guid", "mime", "helper", "db"],
    Instance: function()
    {
        var _this = this;
        var adapter = null;

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
            initAdapter(ctx);
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
                    adapter.upload(
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
            initAdapter(ctx);
            adapter.deleteObject(
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
         * Set a mock adapter module for unit testing
         * @param {any} mockModule Mock module
         */
        function setMockAdapter(mockModule)
        {
            adapter = mockModule;
        }

        //----------------------------------------------
        // PRIVATE
        //----------------------------------------------

        /**
         * Initialize the S3 adapter module if it is not set up yet
         * @param {*} ctx Request context
         */
        function initAdapter(ctx)
        {
            if(!!adapter)
                return;
            var AWS = require("aws-sdk");
            adapter = new AWS.S3(
            { 
                accessKeyId: ctx.config.storage.awsAccessKeyId, 
                secretAccessKey: ctx.config.storage.awsSecretAccessKey
            });
        }

        this.uploadFile = uploadFile;
        this.deleteFile = deleteFile;
        this.setMockAdapter = setMockAdapter;
        _construct();
    }
};