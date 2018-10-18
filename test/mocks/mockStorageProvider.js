/**
 * A mock storage provider module
 */
const mock = function(provider)
{
    const fs = require("fs");
    const path = require("path");
    let filePartReceivedHandler = null;
    let fileDeletedHandler = null;
    let wstream = null;

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
        const mime = null;
        if(!!options && !!options.contentSettings && !!options.contentSettings.contentType)
            mime = options.contentSettings.contentType;
        processFilePart(name, mime, stream, null, callback);
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
        const name = options.Key;
        const stream = options.Body;
        const mime = options.ContentType;
        processFilePart(name, mime, stream, null, callback);
    }

    /**
     * Delete a file from an Amazon S3 storage
     * @param {*} options delete options
     * @param {*} callback callback function
     */
    function s3DeleteObject(options, callback)
    {
        processFileDelete(options.Key, callback);
    }

    /**
     * Rename an uploaded file
     * @param {*} tempPath Temporary upload path
     * @param {*} finalPath Final upload path
     * @param {*} callback Callback function
     */
    function localRename(tempPath, finalPath, callback)
    {
        const filename = path.basename(tempPath);
        processFilePart(filename, null, null, tempPath, callback);
    }

    /**
     * Remove an uploaded file
     * @param {*} fullPath Full path of the file to delete
     * @param {*} callback Callback function
     */
    function localUnlink(fullPath, callback)
    {
        const filename = path.basename(fullPath);
        processFileDelete(filename, callback);
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
     * @param {*} mime Mime type
     * @param {*} stream File stream
     * @param {*} tempPath Temporary file path
     * @param {*} callback Callback function
     */
    function processFilePart(name, mime, stream, tempPath, callback)
    {
        // save the uploaded file to the system temp folder
        const targetPath = process.env.temp + "\\" + name;
        if(!!stream)
        {
            if(!wstream || wstream.path !== targetPath)
            {
                wstream = fs.createWriteStream(targetPath);
                wstream.on('finish', callback);
            }
            stream.pipe(wstream);
        }
        else if(!!tempPath)
        {
            fs.rename(tempPath, targetPath, callback);
        }

        if(!!filePartReceivedHandler)
            filePartReceivedHandler(name, mime);
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
    this.rename = localRename;
    this.unlink = localUnlink;
    this.onFilePartReceived = onFilePartReceived;
    this.onFileDeleted = onFileDeleted;
    _construct();
};

module.exports = mock;