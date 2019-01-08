export interface IStorageAdapter
{
    /**
     * Upload a file to a local path
     * @param fileName File name
     * @param stream File stream
     * @param uploadPath Target upload path
     * @returns error if any
     */
    localUploadAsync(fileName: string, stream: any, uploadPath: string): Promise<any>;

    /**
     * Delete a file from a local path
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

    /**
     * Upload a file to a custom storage provider
     * @param fileName File name
     * @param stream File stream
     * @param size File size
     * @returns error if any
     */
    customUploadAsync(fileName: string, stream: any, size: number): Promise<any>;

    /**
     * Delete a file from a custom storage provider
     * @param fileName file name
     * @returns error if any
     */
    customDeleteAsync(fileName: string): Promise<any>;
}