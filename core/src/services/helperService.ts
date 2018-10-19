import { Context, NameValueMap } from "../types";
import { Database } from "../database";
import { execService } from "./execService";

/**
 * A module containing utility/helper functions
 */
class HelperService
{
    /**
     * Get a list of fields that are accessible from the given entity for the
     * specified action.
     * @param {any} ctx Request context
     * @param {any} action Action name
     * @param {any} entity Entity name
     * @returns an array of field names
     */
    getFields (ctx:Context, action:string, entity:string): string[]
    {
        if(!entity)
            entity = ctx.entity;
        const fields = ctx.config.entities[entity].fields;
        const allowedFields = [];
        for(const fieldName in fields)
        {
            if(!fields.hasOwnProperty(fieldName))
                continue;
            if(!(action === "read" && fields[fieldName].type === "secret") &&
                !(action === "update" && !fields[fieldName].isEditable))
            {
                allowedFields.push(fieldName);
            }
        }
        return allowedFields;
    }

    /**
     * Fix the key name and type of each item in the given data object
     * @param {any} ctx Request context
     * @param {any} data Data object
     * @param {any} entity Entity name
     * @returns fixed data object
     */
    fixDataKeysAndTypes (ctx:Context, data:NameValueMap, entity?:string): NameValueMap
    {
        if(!data)
            return data;
        const newData:any = {};
        for(const key in data)
        {
            if(!data.hasOwnProperty(key))
                continue;
            if(key.indexOf("_") >= 0)
            {
                const keyParts = key.split("_");
                const outerKey = keyParts[0].toLowerCase();
                const innerKey = keyParts[1].toLowerCase();
                if(!newData[outerKey])
                    newData[outerKey] = {};
                newData[outerKey][innerKey] = data[key];
            }
            else
            {
                newData[key.toLowerCase()] = data[key];
            }
        }
        if(!entity) 
            entity = ctx.entity;
        this.fixDataTypes(ctx, entity, newData);
        for(const newKey in newData)
        {
            if(!newData.hasOwnProperty(newKey) || !newData[newKey] || typeof(newData[newKey]) !== "object")
                continue;
            this.fixDataTypes(ctx, entity, newData[newKey]);
        }
        return newData;
    }

    /**
     * To be invoked at the beginning of a write request (create/update/delete).
     * This will check if an action is permitted, given the context and target record.
     * Also resolve any foreign key that exists in the request body.
     * Throws an exception on failure.
     * @param {any} ctx Request context
     * @param {any} action Action name
     * @param {any} db Database module
     * @param {any} recordId Record ID
     * @param {any} requestBody Requset body
     */
    onBeginWriteRequest (ctx:Context, action:string, db:Database, recordId:string, requestBody:NameValueMap): Promise<any>
    {
        return new Promise(async resolve =>
        {
            requestBody = this.fixDataKeysAndTypes(ctx, requestBody);
            const isWriteAllowedFn = ctx.config.entities[ctx.entity].isWriteAllowed;
            if(action === "create")
            {
                this.validateRoles(ctx, "create");
                requestBody = await this.resolveForeignKeys(ctx, requestBody, db);
                if (isWriteAllowedFn && !isWriteAllowedFn(action, ctx.user.roles, ctx.user.id, null, requestBody))
                    execService.throwError("c75f", 400, "bad create request. operation not allowed.");
                resolve({ record: null, requestBody: requestBody });
            }
            else
            {
                let record = await db.findRecordById(ctx, ctx.entity, recordId);
                if(!record)
                    execService.throwError("7e13", 400, "record not found with id " + recordId);
                record = this.fixDataKeysAndTypes(ctx, record);
                
                if((ctx.entity === "user" && ctx.user.id === record.id) || (ctx.entity !== "user" && ctx.user.id === record.ownerid))
                    ctx.user.roles.push("owner");
                this.validateRoles(ctx, action);
                
                if (isWriteAllowedFn && !isWriteAllowedFn(action, ctx.user.roles, ctx.user.id, record, requestBody))
                    execService.throwError("29c8", 400, "bad " + action + " request. operation not allowed.");
                resolve({ record: record, requestBody: requestBody });
            }
        }).catch(promiseErr => console.log(promiseErr));
    }

    /**
     * Check if the given action is permitted, given the current user roles context.
     * Throws an exception on failure.
     * @param {any} ctx Request context
     * @param {any} action Action name
     */
    validateRoles(ctx:Context, action:string): void
    {
        if (!ctx.config.entities[ctx.entity].allowedRoles[action].containsAny(ctx.user.roles))
            execService.throwError("c327", 401, "Unauthorized");
    }

    /**
     * Fix the type of each item in the given data object
     * @param {any} ctx Request context
     * @param {any} entity Entity name
     * @param {any} dataObj Data object
     * @returns fixed data object
     */
    fixDataTypes(ctx:Context, entity:string, dataObj:NameValueMap)
    {
        const fields = ctx.config.entities[entity].fields;
        for(const fieldName in fields)
        {
            if(!fields.hasOwnProperty(fieldName))
                continue;
            const fieldType = fields[fieldName].type;
            if(dataObj[fieldName] === null || typeof(dataObj[fieldName]) === "undefined")
                continue;
            if(fieldType === "int")
            {
                dataObj[fieldName] = parseInt(dataObj[fieldName]);
            }
            else if(fieldType === "float")
            {
                dataObj[fieldName] = parseFloat(dataObj[fieldName]);
            }
        }
    }


    /**
     * Resolve the foreign keys in the given request body
     * @param {any} ctx Request context
     * @param {any} requestBody Request body
     * @param {any} db Database module
     */
    resolveForeignKeys(ctx:Context, requestBody:NameValueMap, db:Database): Promise<any>
    {
        return new Promise(async resolve =>
        {
            const fields = ctx.config.entities[ctx.entity].fields;
            const promises = [];
            for(const fieldName in fields)
            {
                if(!fields.hasOwnProperty(fieldName) || !fields[fieldName].foreignKey || !requestBody[fieldName])
                    continue;
                const promise = this.resolveForeignKey(ctx, requestBody, fieldName, fields[fieldName].foreignKey, db);
                promises.push(promise);
            }
            for(const promise of promises)
                await promise;
        }).catch(promiseErr => console.log(promiseErr));
    }

    /**
     * Resolve a foreign key field in the given request body
     * @param {any} ctx Request context
     * @param {any} requestBody Request body
     * @param {any} fieldName Field name
     * @param {any} fk Foreign key object
     * @param {any} db Database module
     */
    async resolveForeignKey(ctx:Context, requestBody:NameValueMap, fieldName:string, fk:any, db:Database): Promise<any>
    {
        const record = await db.findRecordById(ctx, fk.foreignEntity, requestBody[fieldName]);
        requestBody[fk.resolvedKeyName] = this.fixDataKeysAndTypes(ctx, record);
    }
}

const helperService = new HelperService();
export { helperService };