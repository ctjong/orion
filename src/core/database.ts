import { Context, Condition, NameValueMap } from './types';

export interface Database
{
    /**
     * Quick find a record based on the given condition
     * @param ctx Request context
     * @param fields Requested fields
     * @param entity Requested entity
     * @param conditionMap Search condition
     * @returns query results
     */
    quickFindAsync(ctx:Context, fields:string[], entity:string, conditionMap:NameValueMap): Promise<any>;

    /**
     * Find records that match the given condition
     * @param ctx Request context
     * @param fields Requested fields
     * @param entity Requested entity
     * @param condition Search condition
     * @param orderByField Field to order the results by
     * @param skip Number of matches to skip
     * @param take Number of matches to take
     * @param resolveFK Whether or not foreign keys should be resolved
     * @param isFullMode Whether or not result should be returned in full mode
     * @returns query results
     */
    selectAsync(ctx:Context, fields:string[], entity:string, condition:Condition, orderByField:string, skip:number, take:number, 
        resolveFK:boolean, isFullMode:boolean): Promise<any>;

    /**
     * Find a record that matches the given id
     * @param ctx Request context
     * @param entity Requested entity
     * @param recordId Id of record to find
     * @returns query results
     */
    findRecordByIdAsync(ctx:Context, entity:string, recordId:string): Promise<any>;

    /**
     * Count the number of records that match the given condition
     * @param ctx Request context
     * @param entity Requested entity
     * @param condition Condition
     * @returns query results
     */
    countAsync(ctx:Context, entity:string, condition:Condition): Promise<any>;

    /**
     * Insert a new record
     * @param ctx Request context
     * @param entity Requested entity
     * @param fieldNames New record field names
     * @param fieldValues New record field values
     * @returns inserted ID
     */
    insertAsync(ctx:Context, entity:string, fieldNames:string[], fieldValues:string[]): Promise<any>;

    /**
     * Update a record
     * @param ctx Request context
     * @param entity Requested entity
     * @param updateData Update data
     * @param condition Update condition
     * @returns query results
     */
    updateAsync(ctx:Context, entity:string, updateData:NameValueMap, condition:Condition): Promise<any>;

    /**
     * Delete a record from the database
     * @param ctx Request context
     * @param entity Requested entity
     * @param id Id of record to delete
     * @returns query results
     */
    deleteRecordAsync(ctx:Context, entity:string, id:string): Promise<any>;
}