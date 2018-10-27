import * as fs from "fs";
import * as path from "path";

/**
 * A mock storage provider module
 */
export class MockStorageProvider
{
    filePartReceivedHandler:any = null;
    fileDeletedHandler:any = null;
    wstream:any = null;

    /**
     * Upload a file to an Azure blob storage
     * @param containerName azure container name
     * @param name  file name
     * @param stream file stream
     * @param size file size
     * @param options upload options
     * @param callback callback function
     */
    azureCreateBlockBlobFromStream (containerName:string, name:string, stream:any, size:number, options:any, callback:any)
    {
        let mime = null;
        if(options && options.contentSettings && options.contentSettings.contentType)
            mime = options.contentSettings.contentType;
        this.processFilePart(name, mime, stream, null, callback);
    }

    /**
     * Delete a file from an Azure blob storage
     * @param containerName azure container name
     * @param filename file name
     * @param callback callback function
     */
    azureDeleteBlob(containerName:string, filename:string, callback:any)
    {
        this.processFileDelete(filename, callback);
    }

    /**
     * Upload a file to an Amazon S3 storage
     * @param options upload options
     * @param callback callback function
     */
    s3Upload(options:any, callback:any)
    {
        const name = options.Key;
        const stream = options.Body;
        const mime = options.ContentType;
        this.processFilePart(name, mime, stream, null, callback);
    }

    /**
     * Delete a file from an Amazon S3 storage
     * @param options delete options
     * @param callback callback function
     */
    s3DeleteObject(options:any, callback:any)
    {
        this.processFileDelete(options.Key, callback);
    }

    /**
     * Rename an uploaded file
     * @param tempPath Temporary upload path
     * @param finalPath Final upload path
     * @param callback Callback function
     */
    localRename(tempPath:string, finalPath:string, callback:any)
    {
        const filename = path.basename(tempPath);
        this.processFilePart(filename, null, null, tempPath, callback);
    }

    /**
     * Remove an uploaded file
     * @param fullPath Full path of the file to delete
     * @param callback Callback function
     */
    localUnlink(fullPath:string, callback:any)
    {
        const filename = path.basename(fullPath);
        this.processFileDelete(filename, callback);
    }

    /**
     * Set a handler to be invoked when a file part is received
     * @param handler handler function
     */
    onFilePartReceived(handler:any)
    {
        this.filePartReceivedHandler = handler;
    }

    /**
     * Set a handler to be invoked when a file is deleted
     * @param handler handler function
     */
    onFileDeleted(handler:any)
    {
        this.fileDeletedHandler = handler;
    }

    /**
     * Process an uploaded file part
     * @param name File name
     * @param mime Mime type
     * @param stream File stream
     * @param tempPath Temporary file path
     * @param callback Callback function
     */
    processFilePart(name:string, mime:string, stream:any, tempPath:string, callback:any)
    {
        // save the uploaded file to the system temp folder
        const targetPath = process.env.temp + "\\" + name;
        if(stream)
        {
            if(!this.wstream || this.wstream.path !== targetPath)
            {
                this.wstream = fs.createWriteStream(targetPath);
                this.wstream.on('finish', callback);
            }
            stream.pipe(this.wstream);
        }
        else if(tempPath)
        {
            fs.rename(tempPath, targetPath, callback);
        }

        if(this.filePartReceivedHandler)
            this.filePartReceivedHandler(name, mime);
    }

    /**
     * Process a file delete
     * @param filename File name
     * @param callback Callback function
     */
    processFileDelete(filename:string, callback:any)
    {
        if(this.fileDeletedHandler)
            this.fileDeletedHandler(filename);
        callback(null);
    }
};