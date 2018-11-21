import * as Express from "express";

/**
 * Defines the Orion App type
 */
export interface IOrionApp
{
    app:Express.Express;
    express:any;
    
    /**
     * Set up API endpoints
     */
    setupApiEndpoints(): void;

    /**
     * Start the app at the given port
     * @param port optional port to start the app at
     * @returns server object
     */
    startAsync(port?:number): Promise<any>;

    /**
     * Find a record by id
     * @param originalReq original request context where app is called from
     * @param entityName target entity of the read operation
     * @param id record id
     * @returns query results
     */
    findByIdAsync(originalReq:any, entityName:string, id:string): Promise<any>;

    /**
     * Find a record by condition
     * @param originalReq original request context where app is called from
     * @param entityName target entity of the read operation
     * @param orderByField field name to order the results by
     * @param skip number of records to skip (for pagination)
     * @param take number of records to take (for pagination)
     * @param condition condition string
     * @returns query results
     */
    findByConditionAsync(originalReq:any, entityName:string, orderByField:string, skip:number, take:number, condition:any): Promise<any>;

    /**
     * Get all records for the specified entity
     * @param originalReq original request context where app is called from
     * @param entityName target entity of the read operation
     * @param orderByField field name to order the results by
     * @param skip number of records to skip (for pagination)
     * @param take number of records to take (for pagination)
     * @returns query results
     */
    findAllAsync(originalReq:any, entityName:string, orderByField:string, skip:number, take:number): Promise<any>;
}