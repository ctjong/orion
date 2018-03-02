/**
 * A mock storage provider module
 */
var mock = function(provider)
{
    var fs = require("fs");
    var filePartReceivedHandler = null;
    var fileDeletedHandler = null;
    var wstream = null;

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
        processFilePart(name, stream, size, mime, callback);
    }

    /**
     * Delete a file from an Azure blob storage
     * @param {*} containerName azure container name
     * @param {*} filename file name
     * @param {*} callback callback function
     */
    function azureDeleteBlob(containerName, filename, callback)
    {
        processFileDelete(filename, callback);
    }

    /**
     * Upload a file to an Amazon S3 storage
     * @param {*} options upload options
     * @param {*} callback callback function
     */
    function s3Upload(options, callback)
    {
        var name = options.Key;
        var stream = options.Body;
        var size = options.ContentLength;
        var mime = options.ContentType;
        processFilePart(name, stream, size, mime, callback);
    }

    /**
     * Delete a file from an Amazon S3 storage
     * @param {*} options delete options
     * @param {*} callback callback function
     */
    function s3DeleteObject(options, callback)
    {
        processFileDelete(optoins.Key, callback);
    }

    /**
     * Set a handler to be invoked when a file part is received
     * @param {*} handler handler function
     */
    function onFilePartReceived(handler)
    {
        filePartReceivedHandler = handler;
    }

    /**
     * Set a handler to be invoked when a file is deleted
     * @param {*} handler handler function
     */
    function onFileDeleted(handler)
    {
        fileDeletedHandler = handler;
    }

    //----------------------------------------------
    // PRIVATE
    //----------------------------------------------

    /**
     * Process an uploaded file part
     * @param {*} name File name
     * @param {*} stream File stream
     * @param {*} size File size
     * @param {*} mime Mime type
     * @param {*} callback Callback function
     */
    function processFilePart(name, stream, size, mime, callback)
    {
        // save the uploaded file to the system temp folder
        var targetPath = process.env.temp + "\\" + name;
        if(!wstream || wstream.path !== targetPath)
        {
            wstream = fs.createWriteStream(targetPath);
            wstream.on('finish', callback);
        }
        stream.pipe(wstream);

        if(!!filePartReceivedHandler)
            filePartReceivedHandler(name, stream, size, mime);
    }

    /**
     * Process a file delete
     * @param {*} filename File name
     * @param {*} callback Callback function
     */
    function processFileDelete(filename, callback)
    {
        if(!!fileDeletedHandler)
            fileDeletedHandler(filename);
        callback(null);
    }

    this.createBlockBlobFromStream = azureCreateBlockBlobFromStream;
    this.deleteBlob = azureDeleteBlob;
    this.upload = s3Upload;
    this.deleteObject = s3DeleteObject;
    this.onFilePartReceived = onFilePartReceived;
    this.onFileDeleted = onFileDeleted;
    _construct();
};

module.exports = mock;