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
            var s3UploadQueue = null;
            var isFirstPartReceived = false;
            var form = new (_this.multiparty.Form)();
            form.on('part', function(stream) 
            {
                _this.exec.safeExecute(ctx, function()
                {
                    isFirstPartReceived = true;
                    if (!stream.filename)
                        throw new _this.error.Error("8dad", 400, "submitted file is not a valid file");
                    var size = stream.byteCount - stream.byteOffset;
                    var name = _this.guid.raw() + stream.filename.substring(stream.filename.lastIndexOf("."));
                    if(!s3UploadQueue)
                    {
                        s3UploadQueue = new UploadQueue(ctx, form, name, callback);
                        s3UploadQueue.start();
                    }
                    s3UploadQueue.add(stream);
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
                Bucket: ctx.config.storage.s3Bucket,
                Key: filename
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
            AWS.config.update(
            { 
                accessKeyId: ctx.config.storage.awsAccessKeyId, 
                secretAccessKey: ctx.config.storage.awsAccessKeyId
            });
            s3 = new AWS.S3();
        }

        /**
         * A queue class for handling uploads to S3
         * @param {*} ctx Request context
         * @param {*} form Submitted form values
         * @param {*} targetFileName Target file name on S3
         * @param {*} finalCallback Final callback function
         */
        function UploadQueue(ctx, form, targetFileName, finalCallback)
        {
            var _thisQueue = this;
            var queue = [];
            var partNum = 1;
            var isStarted = false;
            this.targetFileName = targetFileName;
            this.uploadId = null;

            /**
             * Handler to be invoked when this queue is emptied
             */
            function onEmptyQueue()
            {
                if(form.bytesExpected > 0)
                    return;
                s3.completeMultipartUpload(
                {
                    Bucket: ctx.config.storage.s3Bucket,
                    Key: targetFileName,
                    UploadId: s3UploadId
                },
                function(err, data)
                {
                    finalCallback(err);
                });
            }

            /**
             * Add a task to the queue for uploading a file part to S3
             * @param stream Stream object containing the file part to upload
             */
            function add(stream)
            {
                var newTask = new UploadTask(ctx, _thisQueue, stream, partNum++, function()
                {
                    if(queue.length === 0)
                        onEmptyQueue();
                    else
                        queue.shift().run();
                });
                if (isStarted && queue.length === 0)
                    newTask.run();
                else
                    queue.push(newTask);
            }

            /**
             * Start executing the upload tasks in this queue
             */
            function start()
            {
                s3.createMultipartUpload(
                {
                    Bucket: ctx.config.storage.s3Bucket,
                    Key: targetFileName,
                    ContentType: _this.mime.lookup(targetFileName)
                },
                function(s3CreateErr, multipart)
                {
                    _this.exec.safeExecute(ctx, function()
                    {
                        if(s3CreateErr)
                            throw new _this.error.Error("9674", 400, "error occurred while initiating an S3 upload session.");
                        _thisQueue.uploadId = multipart.UploadId;
                        var task = queue.shift();
                        if(task)
                            task.run();
                        isStarted = true;
                    });
                });
            }

            this.add = add;
            this.start = start;
        }

        /**
         * A class representing an S3 upload task
         * @param {*} ctx Request context
         * @param {*} uploadQueue Upload queue object
         * @param {*} stream Stream containing the file part to upload
         * @param {*} partNum Current part number
         * @param {*} callback Callback function
         */
        function UploadTask(ctx, uploadQueue, stream, partNum, callback)
        {
            /**
             * Run the upload task
             */
            this.run = function()
            {
                s3.uploadPart(
                {
                    Body: stream,
                    Bucket: ctx.config.storage.s3Bucket,
                    Key: uploadQueue.targetFileName,
                    UploadId: uploadQueue.uploadId,
                    PartNumber: partNum
                },
                function(s3UploadErr, data) 
                {
                    if(s3UploadErr)
                        throw new _this.error.Error("cf82", 400, "error occurred while uploading a file part to S3.");
                    callback();
                });
            }
        }

        this.uploadFile = uploadFile;
        this.deleteFile = deleteFile;
        _construct();
    }
};