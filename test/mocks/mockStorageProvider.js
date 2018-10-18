const fs = require("fs");
const path = require("path");

/**
 * A mock storage provider module
 */
module.exports = class MockStorageProvider
{
    constructor()
    {
        this.filePartReceivedHandler = null;
        this.fileDeletedHandler = null;
        this.wstream = null;
    }

    /**
     * Upload a file to an Azure blob storage
     * @param {*} containerName azure container name
     * @param {*} name  file name
     * @param {*} stream file stream
     * @param {*} size file size
     * @param {*} options upload options
     * @param {*} callback callback function
     */
    azureCreateBlockBlobFromStream (containerName, name, stream, size, options, callback)
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
    azureDeleteBlob(containerName, filename, callback)
    {
        processFileDelete(filename, callback);
    }

    /**
     * Upload a file to an Amazon S3 storage
     * @param {*} options upload options
     * @param {*} callback callback function
     */
    s3Upload(options, callback)
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
    s3DeleteObject(options, callback)
    {
        processFileDelete(options.Key, callback);
    }

    /**
     * Rename an uploaded file
     * @param {*} tempPath Temporary upload path
     * @param {*} finalPath Final upload path
     * @param {*} callback Callback function
     */
    localRename(tempPath, finalPath, callback)
    {
        const filename = path.basename(tempPath);
        processFilePart(filename, null, null, tempPath, callback);
    }

    /**
     * Remove an uploaded file
     * @param {*} fullPath Full path of the file to delete
     * @param {*} callback Callback function
     */
    localUnlink(fullPath, callback)
    {
        const filename = path.basename(fullPath);
        processFileDelete(filename, callback);
    }

    /**
     * Set a handler to be invoked when a file part is received
     * @param {*} handler handler function
     */
    onFilePartReceived(handler)
    {
        this.filePartReceivedHandler = handler;
    }

    /**
     * Set a handler to be invoked when a file is deleted
     * @param {*} handler handler function
     */
    onFileDeleted(handler)
    {
        this.fileDeletedHandler = handler;
    }
};


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
const processFilePart = (name, mime, stream, tempPath, callback) =>
{
    // save the uploaded file to the system temp folder
    const targetPath = process.env.temp + "\\" + name;
    if(!!stream)
    {
        if(!this.wstream || this.wstream.path !== targetPath)
        {
            this.wstream = fs.createWriteStream(targetPath);
            this.wstream.on('finish', callback);
        }
        stream.pipe(this.wstream);
    }
    else if(!!tempPath)
    {
        fs.rename(tempPath, targetPath, callback);
    }

    if(!!this.filePartReceivedHandler)
        this.filePartReceivedHandler(name, mime);
}

/**
 * Process a file delete
 * @param {*} filename File name
 * @param {*} callback Callback function
 */
const processFileDelete = (filename, callback) =>
{
    if(!!this.fileDeletedHandler)
        this.fileDeletedHandler(filename);
    callback(null);
}