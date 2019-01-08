const fs = require("fs");
const path = require("path");

/**
 * A mock storage adapter
 */
module.exports = class MockStorageAdapter
{
    /**
     * Construct the mock storage adapter
     * @param basePath Path to where the uploaded files will be stored
     */
    constructor(basePath)
    {
        this.basePath = basePath;
    }

    /**
     * Upload a file to an Azure blob storage.
     * @param containerName azure container name
     * @param name  file name
     * @param stream file stream
     * @param size file size
     * @param options upload options
     * @returns error if any
     */
    azureUploadAsync(containerName, name, stream, size, options)
    {
        let mime = null;
        if (options && options.contentSettings && options.contentSettings.contentType)
            mime = options.contentSettings.contentType;
        return this.processFilePartAsync(name, stream, null);
    }

    /**
     * Delete a file from an Azure blob storage.
     * @param containerName azure container name
     * @param filename file name
     * @returns error if any
     */
    azureDeleteAsync(containerName, filename)
    {
        return this.processFileDeleteAsync(filename);
    }

    /**
     * Upload a file to an Amazon S3 storage.
     * @param options upload options
     * @returns error if any
     */
    s3UploadAsync(options)
    {
        const name = options.Key;
        const stream = options.Body;
        return this.processFilePartAsync(name, stream, null);
    }

    /**
     * Delete a file from an Amazon S3 storage.
     * @param options delete options
     * @returns error if any
     */
    s3DeleteAsync(options)
    {
        return this.processFileDeleteAsync(options.Key);
    }

    /**
     * Upload a file to a local path
     * @param fileName File name
     * @param stream File stream
     * @param uploadPath Target upload path
     * @returns error if any
     */
    localUploadAsync(fileName, stream, uploadPath)
    {
        return this.processFilePartAsync(fileName, stream, uploadPath);
    }

    /**
     * Delete a file from a local path
     * @param fullPath Full path of the file to delete
     * @returns error if any
     */
    localDeleteAsync(fullPath)
    {
        const filename = path.basename(fullPath);
        return this.processFileDeleteAsync(filename);
    }

    /**
     * Process an uploaded file part.
     * Note that this is using the old callback argument style instead of Promise because the purpose
     * of this function is to override the the library functions, which are not returning a Promise.
     * @param name File name
     * @param stream File stream
     * @param tempPath Temporary file path
     * @returns error if any
     */
    processFilePartAsync(name, stream, tempPath)
    {
        const basePath = this.basePath;
        return new Promise(resolve =>
        {
            try
            {
                // save the uploaded file to the system temp folder
                const targetPath = `${basePath}/${name}`;
                if (!fs.existsSync(basePath))
                    fs.mkdirSync(basePath);
                if (!fs.existsSync(targetPath))
                    fs.writeFileSync(targetPath, "");
                if (stream)
                {
                    if (!this.wstream || this.wstream.path !== targetPath)
                    {
                        this.wstream = fs.createWriteStream(targetPath);
                        this.wstream.on('finish', (error) => resolve(error));
                    }
                    stream.pipe(this.wstream);
                }
                else if (tempPath)
                {
                    fs.rename(tempPath, targetPath, (error) => resolve(error));
                }
            }
            catch (err)
            {
                console.log(err);
                resolve(err);
            }
        });
    }

    /**
     * Process a file delete.
     * @param filename File name
     * @returns error if any
     */
    processFileDeleteAsync(filename)
    {
        const basePath = this.basePath;
        return new Promise(resolve =>
        {
            try
            {
                const targetPath = `${basePath}/${filename}`;
                if (!fs.existsSync(targetPath))
                    throw `File not found in the storage: ${targetPath}`;

                fs.unlinkSync(targetPath);
                resolve(null);
            }
            catch (err)
            {
                console.log(err);
                resolve(err);
            }
        });
    }
};