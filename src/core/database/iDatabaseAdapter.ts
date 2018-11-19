import { Context, ICondition, INameValueMap } from '../types';

export interface IDatabaseAdapter
{
    /**
     * Quick find a record based on the given condition
     * @param ctx Request context
     * @param fields Requested fields
     * @param entityName Requested entity name
     * @param conditionMap Search condition
     * @returns query results
     */
    quickFindAsync(ctx:Context, fields:string[], entityName:string, conditionMap:INameValueMap): Promise<any>;

    /**
     * Find records that match the given condition
     * @param ctx Request context
     * @param fields Requested fields
     * @param entityName Requested entity nane
     * @param condition Search condition
     * @param orderByField Field to order the results by
     * @param skip Number of matches to skip
     * @param take Number of matches to take
     * @param resolveFK Whether or not foreign keys should be resolved
     * @param isFullMode Whether or not result should be returned in full mode
     * @returns query results
     */
    selectAsync(ctx:Context, fields:string[], entityName:string, condition:ICondition, orderByField:string, skip:number, take:number, 
        resolveFK:boolean, isFullMode:boolean): Promise<any>;

    /**
     * Find a record that matches the given id
     * @param ctx Request context
     * @param entityName Requested entity name
     * @param recordId Id of record to find
     * @returns query results
     */
    findRecordByIdAsync(ctx:Context, entityName:string, recordId:string): Promise<any>;

    /**
     * Count the number of records that match the given condition
     * @param ctx Request context
     * @param entityName Requested entity name
     * @param condition Condition object
     * @returns query results
     */
    countAsync(ctx:Context, entity:string, condition:ICondition): Promise<any>;

    /**
     * Insert a new record
     * @param ctx Request context
     * @param entityName Requested entity name
     * @param fieldNames New record field names
     * @param fieldValues New record field values
     * @returns inserted ID
     */
    insertAsync(ctx:Context, entityName:string, fieldNames:string[], fieldValues:string[]): Promise<any>;

    /**
     * Update a record
     * @param ctx Request context
     * @param entityName Requested entity name
     * @param updateData Update data
     * @param condition Update condition
     * @returns query results
     */
    updateAsync(ctx:Context, entityName:string, updateData:INameValueMap, condition:ICondition): Promise<any>;

    /**
     * Delete a record from the database
     * @param ctx Request context
     * @param entityName Requested entity name
     * @param id Id of record to delete
     * @returns query results
     */
    deleteRecordAsync(ctx:Context, entityName:string, id:string): Promise<any>;
}