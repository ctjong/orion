import { Context, Condition, NameValueMap } from './types';

export interface Database
{
    /**
     * Quick find a record based on the given condition
     * @param {any} ctx Request context
     * @param {any} fields Requested fields
     * @param {any} entity Requested entity
     * @param {any} conditionMap Search condition
     */
    quickFind(ctx:Context, fields:string[], entity:string, conditionMap:NameValueMap): Promise<any>;

    /**
     * Find records that match the given condition
     * @param {any} ctx Request context
     * @param {any} fields Requested fields
     * @param {any} entity Requested entity
     * @param {any} condition Search condition
     * @param {any} orderByField Field to order the results by
     * @param {any} skip Number of matches to skip
     * @param {any} take Number of matches to take
     * @param {any} resolveFK Whether or not foreign keys should be resolved
     * @param {any} isFullMode Whether or not result should be returned in full mode
     */
    select(ctx:Context, fields:string[], entity:string, condition:Condition, orderByField:string, skip:number, take:number, 
        resolveFK:boolean, isFullMode:boolean): Promise<any>;

    /**
     * Find a record that matches the given id
     * @param {any} ctx Request context
     * @param {any} entity Requested entity
     * @param {any} recordId Id of record to find
     */
    findRecordById(ctx:Context, entity:string, recordId:string): Promise<any>;

    /**
     * Count the number of records that match the given condition
     * @param {any} ctx Request context
     * @param {any} entity Requested entity
     * @param {any} condition Condition
     */
    count(ctx:Context, entity:string, condition:Condition): Promise<any>;

    /**
     * Insert a new record
     * @param {any} ctx Request context
     * @param {any} entity Requested entity
     * @param {any} fieldNames New record field names
     * @param {any} fieldValues New record field values
     */
    insert(ctx:Context, entity:string, fieldNames:string[], fieldValues:string[]): Promise<any>;

    /**
     * Update a record
     * @param {any} ctx Request context
     * @param {any} entity Requested entity
     * @param {any} updateFields Fields to update
     * @param {any} condition Update condition
     */
    update(ctx:Context, entity:string, updateFields:string[], condition:Condition): Promise<any>;

    /**
     * Delete a record from the database
     * @param {any} ctx Request context
     * @param {any} entity Requested entity
     * @param {any} id Id of record to delete
     */
    deleteRecord(ctx:Context, entity:string, id:string): Promise<any>;

    /**
     * Set the connection pool to be used by this adapter
     * @param {any} connectionPool connection pool
     */
    setConnectionPool(connectionPool:any): void
}