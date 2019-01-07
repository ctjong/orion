import { IStorageCommandWrapper } from "./iStorageCommandWrapper";
import * as fs from "fs";

export class StorageCommandWrapper implements IStorageCommandWrapper
{
    storageService: any;

    /**
     * Set the service component that will handle the file management
     * @param storageService service component
     */
    setService(storageService:any): void
    {
        this.storageService = storageService;
    }

    /**
     * Rename a file locally
     * @param sourcePath Source file path
     * @param targetPath Target file path
     * @returns error object
     */
    localRenameAsync(sourcePath: string, targetPath: string): Promise<any>
    {
        return new Promise(resolve =>
        {
            fs.rename(sourcePath, targetPath, (error: any) => resolve(error));
        });
    }

    /**
     * Delete a file locally
     * @param path file path
     * @returns error object
     */
    localUnlinkAsync(path: string): Promise<any>
    {
        return new Promise(resolve =>
        {
            fs.unlink(path, (error: any) => resolve(error));
        });
    }

    /**
     * Upload a file to S3
     * @param options upload options
     * @returns error object
     */
    s3UploadAsync(options: any): Promise<any>
    {
        return new Promise(resolve =>
        {
            if (!this.storageService)
                resolve({ msg: "servie not initialized" });
            else
                this.storageService.upload(options, (error:any) => resolve(error));
        });
    }

    /**
     * Delete a file from S3
     * @param options delete options
     * @returns error object
     */
    s3DeleteAsync(options: any): Promise<any>
    {
        return new Promise(resolve =>
        {
            if (!this.storageService)
                resolve({ msg: "servie not initialized" });
            else
                this.storageService.deleteObject(options, (error:any) => resolve(error));
        });
    }

    /**
     * Upload a file to azure blob storage
     * @param containerName Container name
     * @param fileName File name
     * @param stream File stream
     * @param size File size
     * @param options Upload options
     * @returns error object
     */
    azureUploadAsync(containerName: string, fileName: string, stream: any, size: number, options: any): Promise<any>
    {
        return new Promise(resolve =>
        {
            if (!this.storageService)
                resolve({ msg: "servie not initialized" });
            else
                this.storageService.createBlockBlobFromStream(containerName, fileName, stream, size, options, (error:any) => resolve(error));
        });
    }

    /**
     * Delete a file from azure blob storage
     * @param containerName Container name
     * @param fileName file name
     * @returns error object
     */
    azureDeleteAsync(containerName: string, fileName: string): Promise<any>
    {
        return new Promise(resolve =>
        {
            if (!this.storageService)
                resolve({ msg: "servie not initialized" });
            else
                this.storageService.deleteBlob(containerName, fileName, (error:any) => resolve(error));
        });
    }
}