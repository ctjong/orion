/**
 * A mock storage provider module
 */
var mock = function(provider)
{
    var fs = require("fs");
    var fileReceivedHandler = null;

    //----------------------------------------------
    // CONSTRUCTOR
    //----------------------------------------------

    function _construct() { }

    //----------------------------------------------
    // PUBLIC
    //----------------------------------------------

    /**
     * Upload a file to an Azure blob storage
     * @param {*} containerName azure container name
     * @param {*} name  file name
     * @param {*} stream file stream
     * @param {*} size file size
     * @param {*} options upload options
     * @param {*} callback callback function
     */
    function azureCreateBlockBlobFromStream(containerName, name, stream, size, options, callback)
    {
        var mime = null;
        if(!!options && !!options.contentSettings && !!options.contentSettings.contentType)
            mime = options.contentSettings.contentType;
        processFile(name, stream, size, mime, callback);
    }

    /**
     * Delete a file from an Azure blob storage
     * @param {*} containerName azure container name
     * @param {*} filename file name
     * @param {*} callback callback function
     */
    function azureDeleteBlob(containerName, filename, callback)
    {
        //callback=fn(err, response)
        //TODO
    }

    /**
     * Upload a file to an Amazon S3 storage
     * @param {*} options upload options
     * @param {*} callback callback function
     */
    function s3Upload(options, callback)
    {
        //options={Bucket: ctx.config.storage.s3Bucket,Key: name,ACL: 'public-read',Body: stream,ContentLength: stream.byteCount,ContentType: _this.mime.lookup(name)}
        //callback=fn(err, data)
        //TODO
    }

    /**
     * Delete a file from an Amazon S3 storage
     * @param {*} options delete options
     * @param {*} callback callback function
     */
    function s3DeleteObject(options, callback)
    {
        //options={Bucket: ctx.config.storage.s3Bucket,Key: name}
        //callback=fn(err, data)
        //TODO
    }

    /**
     * Set a handler to be invoked when a file is received
     * @param {*} handler 
     */
    function onFileReceived(handler)
    {
        fileReceivedHandler = handler;
    }

    //----------------------------------------------
    // PRIVATE
    //----------------------------------------------

    /**
     * Process an uploaded file
     * @param {*} name File name
     * @param {*} stream File stream
     * @param {*} size File size
     * @param {*} mime Mime type
     * @param {*} callback Callback function
     */
    function processFile(name, stream, size, mime, callback)
    {
        // save the uploaded file to the system temp folder
        var wstream = fs.createWriteStream(process.env.temp + "\\" + name);
        stream.pipe(wstream);

        if(!!fileReceivedHandler)
            fileReceivedHandler(name, stream, size, mime);

        callback(null);
    }

    this.createBlockBlobFromStream = azureCreateBlockBlobFromStream;
    this.deleteBlob = azureDeleteBlob;
    this.upload = s3Upload;
    this.deleteObject = s3DeleteObject;
    this.onFileReceived = onFileReceived;
    _construct();
};

module.exports = mock;