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
     * Upload a file to an Azure blob storage.
     * Note that this is using the old callback argument style instead of Promise because the purpose
     * of this function is to override the the library functions, which are not returning a Promise.
     * @param containerName azure container name
     * @param name  file name
     * @param stream file stream
     * @param size file size
     * @param options upload options
     * @param callback callback function
     */
    azureCreateBlockBlobFromStream (containerName:string, name:string, stream:any, size:number, options:any, callback:any): void
    {
        let mime = null;
        if(options && options.contentSettings && options.contentSettings.contentType)
            mime = options.contentSettings.contentType;
        this.processFilePart(name, mime, stream, null, callback);
    }

    /**
     * Delete a file from an Azure blob storage.
     * Note that this is using the old callback argument style instead of Promise because the purpose
     * of this function is to override the the library functions, which are not returning a Promise.
     * @param containerName azure container name
     * @param filename file name
     * @param callback callback function
     */
    azureDeleteBlob(containerName:string, filename:string, callback:any): void
    {
        this.processFileDelete(filename, callback);
    }

    /**
     * Upload a file to an Amazon S3 storage.
     * Note that this is using the old callback argument style instead of Promise because the purpose
     * of this function is to override the the library functions, which are not returning a Promise.
     * @param options upload options
     * @param callback callback function
     */
    s3Upload(options:any, callback:any): void
    {
        const name = options.Key;
        const stream = options.Body;
        const mime = options.ContentType;
        this.processFilePart(name, mime, stream, null, callback);
    }

    /**
     * Delete a file from an Amazon S3 storage.
     * Note that this is using the old callback argument style instead of Promise because the purpose
     * of this function is to override the the library functions, which are not returning a Promise.
     * @param options delete options
     * @param callback callback function
     */
    s3DeleteObject(options:any, callback:any): void
    {
        this.processFileDelete(options.Key, callback);
    }

    /**
     * Rename an uploaded file.
     * Note that this is using the old callback argument style instead of Promise because the purpose
     * of this function is to override the the library functions, which are not returning a Promise.
     * @param tempPath Temporary upload path
     * @param finalPath Final upload path
     * @param callback Callback function
     */
    localRename(tempPath:string, finalPath:string, callback:any): void
    {
        const filename = path.basename(tempPath);
        this.processFilePart(filename, null, null, tempPath, callback);
    }

    /**
     * Remove an uploaded file.
     * Note that this is using the old callback argument style instead of Promise because the purpose
     * of this function is to override the the library functions, which are not returning a Promise.
     * @param fullPath Full path of the file to delete
     * @param callback Callback function
     */
    localUnlink(fullPath:string, callback:any): void
    {
        const filename = path.basename(fullPath);
        this.processFileDelete(filename, callback);
    }

    /**
     * Set a handler to be invoked when a file part is received
     * @param handler handler function
     */
    onFilePartReceived(handler:any): void
    {
        this.filePartReceivedHandler = handler;
    }

    /**
     * Set a handler to be invoked when a file is deleted
     * @param handler handler function
     */
    onFileDeleted(handler:any): void
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
     * @param callback Callback function
     */
    processFilePart(name:string, mime:string, stream:any, tempPath:string, callback:any): void
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
     * Process a file delete.
     * Note that this is using the old callback argument style instead of Promise because the purpose
     * of this function is to override the the library functions, which are not returning a Promise.
     * @param filename File name
     * @param callback Callback function
     */
    processFileDelete(filename:string, callback:any): void
    {
        if(this.fileDeletedHandler)
            this.fileDeletedHandler(filename);
        callback(null);
    }
};