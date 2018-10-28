import { Context, UploadFileResponse } from "./types";


export interface Storage
{
    /**
     * Upload a file to Azure Blob Storage
     * @param ctx Request context
     * @param req Request object
     */
    uploadFile(ctx:Context, req:any): Promise<UploadFileResponse>;

    /**
     * Delete a file from the storage
     * @param ctx Request context 
     * @param filename File name
     */
    deleteFile(ctx:Context, filename:string): Promise<any>;

    /**
     * Set the provider module for this adapter
     * @param providerModule provider module
     */
    setProvider(providerModule:any): void;
}