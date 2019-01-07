export interface IStorageCommandWrapper
{
    /**
     * Set the service component that will handle the file management
     * @param storageService service component
     */
    setService(storageService: any): void;

    /**
     * Rename a file locally
     * @param sourcePath Source file path
     * @param targetPath Target file path
     * @returns error object
     */
    localRenameAsync(sourcePath: string, targetPath: string): Promise<any>;

    /**
     * Delete a file locally
     * @param path file path
     * @returns error object
     */
    localUnlinkAsync(path: string): Promise<any>;

    /**
     * Upload a file to S3
     * @param options upload options
     * @returns error object
     */
    s3UploadAsync(options: any): Promise<any>;

    /**
     * Delete a file from S3
     * @param options delete options
     * @returns error object
     */
    s3DeleteAsync(options: any): Promise<any>;

    /**
     * Upload a file to azure blob storage
     * @param containerName Container name
     * @param fileName File name
     * @param stream File stream
     * @param size File size
     * @param options Upload options
     * @returns error object
     */
    azureUploadAsync(containerName: string, fileName: string, stream: any, size: number, options: any): Promise<any>;

    /**
     * Delete a file from azure blob storage
     * @param containerName Container name
     * @param fileName file name
     * @returns error object
     */
    azureDeleteAsync(containerName: string, fileName: string): Promise<any>;
}