const fs = require("fs");
const path = require("path");

/**
 * A mock storage command wrapper module
 */
module.exports = class MockStorageCommandWrapper
{
    /**
     * Upload a file to an Azure blob storage.
     * @param containerName azure container name
     * @param name  file name
     * @param stream file stream
     * @param size file size
     * @param options upload options
     * @returns error object
     */
    azureUploadAsync (containerName, name, stream, size, options)
    {
        let mime = null;
        if(options && options.contentSettings && options.contentSettings.contentType)
            mime = options.contentSettings.contentType;
        return this.processFilePartAsync(name, mime, stream, null);
    }

    /**
     * Delete a file from an Azure blob storage.
     * @param containerName azure container name
     * @param filename file name
     * @returns error object
     */
    azureDeleteAsync(containerName, filename)
    {
        return this.processFileDeleteAsync(filename);
    }

    /**
     * Upload a file to an Amazon S3 storage.
     * @param options upload options
     * @returns error object
     */
    s3UploadAsync(options)
    {
        const name = options.Key;
        const stream = options.Body;
        const mime = options.ContentType;
        return this.processFilePartAsync(name, mime, stream, null);
    }

    /**
     * Delete a file from an Amazon S3 storage.
     * @param options delete options
     * @returns error object
     */
    s3DeleteAsync(options)
    {
        return this.processFileDeleteAsync(options.Key);
    }

    /**
     * Rename an uploaded file.
     * @param tempPath Temporary upload path
     * @param finalPath Final upload path
     * @returns error object
     */
    localRenameAsync(tempPath, finalPath)
    {
        const filename = path.basename(tempPath);
        return this.processFilePartAsync(filename, null, null, tempPath);
    }

    /**
     * Remove an uploaded file.
     * @param fullPath Full path of the file to delete
     * @returns error object
     */
    localUnlinkAsync(fullPath)
    {
        const filename = path.basename(fullPath);
        return this.processFileDeleteAsync(filename);
    }

    /**
     * Set a handler to be invoked when a file part is received
     * @param handler handler function
     */
    onFilePartReceived(handler)
    {
        this.filePartReceivedHandler = handler;
    }

    /**
     * Set a handler to be invoked when a file is deleted
     * @param handler handler function
     */
    onFileDeleted(handler)
    {
        this.fileDeletedHandler = handler;
    }

    /**
     * Process an uploaded file part.
     * Note that this is using the old callback argument style instead of Promise because the purpose
     * of this function is to override the the library functions, which are not returning a Promise.
     * @param name File name
     * @param mime Mime type
     * @param stream File stream
     * @param tempPath Temporary file path
     * @returns error object
     */
    processFilePartAsync(name, mime, stream, tempPath)
    {
        return new Promise(resolve =>
        {
            // save the uploaded file to the system temp folder
            const targetPath = `${ASSET_BASE_PATH}/${name}`;
            if(stream)
            {
                if(!this.wstream || this.wstream.path !== targetPath)
                {
                    this.wstream = fs.createWriteStream(targetPath);
                    this.wstream.on('finish', (error) => resolve(error));
                }
                stream.pipe(this.wstream);
            }
            else if(tempPath)
            {
                fs.rename(tempPath, targetPath, (error) => resolve(error));
            }

            if(this.filePartReceivedHandler)
                this.filePartReceivedHandler(name, mime);
        });
    }

    /**
     * Process a file delete.
     * @param filename File name
     */
    processFileDeleteAsync(filename)
    {
        return new Promise(resolve =>
        {
            if(this.fileDeletedHandler)
                this.fileDeletedHandler(filename);
            resolve(null);
        });
    }
};