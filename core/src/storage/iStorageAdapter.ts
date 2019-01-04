import { Context, IUploadFileResponse } from "../types";


export interface IStorageAdapter
{
    /**
     * Upload a file to Azure Blob Storage
     * @param ctx Request context
     * @param req Request object
     */
    uploadFileAsync(ctx:Context, req:any): Promise<IUploadFileResponse>;

    /**
     * Delete a file from the storage
     * @param ctx Request context 
     * @param filename File name
     */
    deleteFileAsync(ctx:Context, filename:string): Promise<any>;
}