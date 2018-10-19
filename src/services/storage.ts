import { Config, Context } from "../types";

export interface Storage
{
    /**
     * Upload a file to Azure Blob Storage
     * @param {any} ctx Request context
     * @param {any} req Request object
     */
    uploadFile(ctx:Context, req:any): Promise<any>;

    /**
     * Delete a file from the storage
     * @param {*} ctx Request context 
     * @param {*} filename File name
     */
    deleteFile(ctx:Context, filename:string): Promise<any>;

    /**
     * Set the provider module for this adapter
     * @param {any} providerModule provider module
     */
    setProvider(providerModule:any): void;
}