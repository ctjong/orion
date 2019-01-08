import { IStorageAdapter } from "./iStorageAdapter";
import * as fs from "fs";
import { IConfig } from "../types";
import * as azureStorage from "azure-storage";
import * as awsSdk from "aws-sdk";

/**
 * Class that handles the communication with storage provider
 */
export class StorageAdapter implements IStorageAdapter
{
    azureService: any;
    s3Service: any;
    wstream: any;

    /**
     * Construct a storage adapter
     * @param config Configuration object
     */
    constructor(config: IConfig)
    {
        const provider = config.storage.provider;
        if (provider === "azure")
        {
            if (!config.storage.azureStorageConnectionString)
                throw "Missing azureStorageConnectionString in the config";
            this.azureService = azureStorage.createBlobService(config.storage.azureStorageConnectionString);
        }
        else if (provider === "s3")
        {
            if (!config.storage.awsAccessKeyId || !config.storage.awsSecretAccessKey)
                throw "Missing awsAccessKeyId or awsSecretAccessKey in the config";
            this.s3Service = new awsSdk.S3(
                {
                    accessKeyId: config.storage.awsAccessKeyId,
                    secretAccessKey: config.storage.awsSecretAccessKey
                });
        }
        else if (provider === "custom")
        {
            throw "Missing custom adapter. Please create a custom storage adapter and pass it to Orion constructor.";
        }
        else if (provider !== "local")
        {
            throw `Unknown provider ${provider}`;
        }
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
                if (!this.s3Service)
                    resolve({ msg: "servie not initialized" });
                else
                    this.s3Service.upload(options, (error: any) => resolve(error));
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
                if (!this.s3Service)
                    resolve({ msg: "servie not initialized" });
                else
                    this.s3Service.deleteObject(options, (error: any) => resolve(error));
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
                if (!this.azureService)
                    resolve({ msg: "servie not initialized" });
                else
                    this.azureService.createBlockBlobFromStream(containerName, fileName, stream, size, options, (error: any) => resolve(error));
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
                if (!this.azureService)
                    resolve({ msg: "servie not initialized" });
                else
                    this.azureService.deleteBlob(containerName, fileName, (error: any) => resolve(error));
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