import { IStorageAdapter } from "./iStorageAdapter";
import * as fs from "fs";

/**
 * Class that handles the communication with storage provider
 */
export class StorageAdapter implements IStorageAdapter
{
    storageService: any;
    wstream: any;

    /**
     * Construct a storage adapter
     * @param storageService Storage service provided by the provider's library
     */
    constructor(storageService: any)
    {
        this.storageService = storageService;
    }

    /**
     * Upload a file to a local path
     * @param fileName File name
     * @param stream File stream
     * @param uploadPath Target upload path
     * @returns error if any
     */
    localUploadAsync(fileName: string, stream: any, uploadPath: string): Promise<any>
    {
        return new Promise(resolve =>
        {
            try
            {
                // save the uploaded file to the system temp folder
                const targetPath = `${uploadPath}/${fileName}`;
                if (!fs.existsSync(uploadPath))
                    fs.mkdirSync(uploadPath);
                if (!fs.existsSync(targetPath))
                    fs.writeFileSync(targetPath, "");
                if (!stream)
                    throw "missing stream";
                if (!this.wstream || this.wstream.path !== targetPath)
                {
                    this.wstream = fs.createWriteStream(targetPath);
                    this.wstream.on('finish', (error: any) => resolve(error));
                }
                stream.pipe(this.wstream);
            }
            catch (err)
            {
                console.log(err);
                resolve(err);
            }
        });
    }

    /**
     * Delete a file from a local path
     * @param path file path
     * @returns error if any
     */
    localDeleteAsync(path: string): Promise<any>
    {
        return new Promise(resolve =>
        {
            try
            {
                fs.unlink(path, (error: any) => resolve(error));
            }
            catch (err)
            {
                console.log(err);
                resolve(err);
            }
        });
    }

    /**
     * Upload a file to S3
     * @param options upload options
     * @returns error if any
     */
    s3UploadAsync(options: any): Promise<any>
    {
        return new Promise(resolve =>
        {
            try
            {
                if (!this.storageService)
                    resolve({ msg: "servie not initialized" });
                else
                    this.storageService.upload(options, (error: any) => resolve(error));
            }
            catch (err)
            {
                console.log(err);
                resolve(err);
            }
        });
    }

    /**
     * Delete a file from S3
     * @param options delete options
     * @returns error if any
     */
    s3DeleteAsync(options: any): Promise<any>
    {
        return new Promise(resolve =>
        {
            try
            {
                if (!this.storageService)
                    resolve({ msg: "servie not initialized" });
                else
                    this.storageService.deleteObject(options, (error: any) => resolve(error));
            }
            catch (err)
            {
                console.log(err);
                resolve(err);
            }
        });
    }

    /**
     * Upload a file to azure blob storage
     * @param containerName Container name
     * @param fileName File name
     * @param stream File stream
     * @param size File size
     * @param options Upload options
     * @returns error if any
     */
    azureUploadAsync(containerName: string, fileName: string, stream: any, size: number, options: any): Promise<any>
    {
        return new Promise(resolve =>
        {
            try
            {
                if (!this.storageService)
                    resolve({ msg: "servie not initialized" });
                else
                    this.storageService.createBlockBlobFromStream(containerName, fileName, stream, size, options, (error: any) => resolve(error));
            }
            catch (err)
            {
                console.log(err);
                resolve(err);
            }
        });
    }

    /**
     * Delete a file from azure blob storage
     * @param containerName Container name
     * @param fileName file name
     * @returns error if any
     */
    azureDeleteAsync(containerName: string, fileName: string): Promise<any>
    {
        return new Promise(resolve =>
        {
            try
            {
                if (!this.storageService)
                    resolve({ msg: "servie not initialized" });
                else
                    this.storageService.deleteBlob(containerName, fileName, (error: any) => resolve(error));
            }
            catch (err)
            {
                console.log(err);
                resolve(err);
            }
        });
    }

    /**
     * Upload a file to a custom storage provider
     * @param fileName File name
     * @param stream File stream
     * @param size File size
     * @returns error if any
     */
    customUploadAsync(fileName: string, stream: any, size: number): Promise<any>
    {
        throw "not implemented";
    }

    /**
     * Delete a file from a custom storage provider
     * @param fileName file name
     * @returns error if any
     */
    customDeleteAsync(fileName: string): Promise<any>
    {
        throw "not implemented";
    }
}