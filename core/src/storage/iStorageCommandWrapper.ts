export interface IStorageCommandWrapper
{
    /**
     * Set the service component that will handle the file management
     * @param storageService service component
     */
    setService(storageService: any): void;

    /**
     * Upload a file to a local path
     * @param fileName File name
     * @param stream File stream
     * @param uploadPath Target upload path
     * @returns error if any
     */
    localUploadAsync(fileName: string, stream: any, uploadPath: string): Promise<any>;

    /**
     * Delete a file locally
     * @param path file path
     * @returns error if any
     */
    localDeleteAsync(path: string): Promise<any>;

    /**
     * Upload a file to S3
     * @param options upload options
     * @returns error if any
     */
    s3UploadAsync(options: any): Promise<any>;

    /**
     * Delete a file from S3
     * @param options delete options
     * @returns error if any
     */
    s3DeleteAsync(options: any): Promise<any>;

    /**
     * Upload a file to azure blob storage
     * @param containerName Container name
     * @param fileName File name
     * @param stream File stream
     * @param size File size
     * @param options Upload options
     * @returns error if any
     */
    azureUploadAsync(containerName: string, fileName: string, stream: any, size: number, options: any): Promise<any>;

    /**
     * Delete a file from azure blob storage
     * @param containerName Container name
     * @param fileName file name
     * @returns error if any
     */
    azureDeleteAsync(containerName: string, fileName: string): Promise<any>;
}