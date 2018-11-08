import { Context, INameValueMap } from "../types";
import { IDatabase } from "../idatabase";
import { execService } from "./execService";

/**
 * A module containing utility/helper functions
 */
class HelperService
{
    /**
     * Get a list of fields that are accessible from the given entity for the
     * specified action.
     * @param ctx Request context
     * @param action Action name
     * @param entity Entity name
     * @returns an array of field names
     */
    getFields(ctx: Context, action: string, entity?: string): string[]
    {
        if (!entity)
            entity = ctx.entity;
        const fields = ctx.config.entities[entity].fields;
        const allowedFields = [];
        for (const fieldName in fields)
        {
            if (!fields.hasOwnProperty(fieldName))
                continue;
            if (!(action === "read" && fields[fieldName].type === "secret") &&
                !(action === "update" && !fields[fieldName].isEditable))
            {
                allowedFields.push(fieldName);
            }
        }
        return allowedFields;
    }

    /**
     * Fix the key name and type of each item in the given data object
     * @param ctx Request context
     * @param data Data object
     * @param entity Entity name
     * @returns fixed data object
     */
    fixDataKeysAndTypes(ctx: Context, data: INameValueMap, entity?: string): INameValueMap
    {
        if (!data)
            return data;
        const newData: any = {};
        for (const key in data)
        {
            if (!data.hasOwnProperty(key))
                continue;
            if (key.indexOf("_") >= 0)
            {
                const keyParts = key.split("_");
                const outerKey = keyParts[0].toLowerCase();
                const innerKey = keyParts[1].toLowerCase();
                if (!newData[outerKey])
                    newData[outerKey] = {};
                newData[outerKey][innerKey] = data[key];
            }
            else
            {
                newData[key.toLowerCase()] = data[key];
            }
        }
        if (!entity)
            entity = ctx.entity;
        this.fixDataTypes(ctx, entity, newData);
        for (const newKey in newData)
        {
            if (!newData.hasOwnProperty(newKey) || !newData[newKey] || typeof (newData[newKey]) !== "object")
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
     * @param ctx Request context
     * @param action Action name
     * @param dbAdapter Database adapter
     * @param recordId Record ID
     * @param requestBody Requset body
     */
    async onBeginWriteRequestAsync(ctx: Context, action: string, dbAdapter: IDatabase, recordId: string, requestBody: INameValueMap): Promise<any>
    {
        requestBody = this.fixDataKeysAndTypes(ctx, requestBody);
        const isWriteAllowedFn = ctx.config.entities[ctx.entity].isWriteAllowed;
        if (action === "create")
        {
            this.validateRoles(ctx, "create");
            requestBody = await this.resolveForeignKeysAsync(ctx, requestBody, dbAdapter);
            if (isWriteAllowedFn && !isWriteAllowedFn(action, ctx.user.roles, ctx.user.id, null, requestBody))
                execService.throwError("c75f", 400, "bad create request. operation not allowed.");
            return { record: null, requestBody: requestBody };
        }
        else
        {
            let record = await dbAdapter.findRecordByIdAsync(ctx, ctx.entity, recordId);
            if (!record)
                execService.throwError("7e13", 400, "record not found with id " + recordId);
            record = this.fixDataKeysAndTypes(ctx, record);

            if ((ctx.entity === "user" && ctx.user.id === record.id) || (ctx.entity !== "user" && ctx.user.id === record.ownerid))
                ctx.user.roles.push("owner");
            this.validateRoles(ctx, action);

            if (isWriteAllowedFn && !isWriteAllowedFn(action, ctx.user.roles, ctx.user.id, record, requestBody))
                execService.throwError("29c8", 400, "bad " + action + " request. operation not allowed.");
            return { record: record, requestBody: requestBody };
        }
    }

    /**
     * Check if the given action is permitted, given the current user roles context.
     * Throws an exception on failure.
     * @param ctx Request context
     * @param action Action name
     */
    validateRoles(ctx: Context, action: string): void
    {
        if (!this.containsAny(ctx.config.entities[ctx.entity].allowedRoles[action], ctx.user.roles))
            execService.throwError("c327", 401, "Unauthorized");
    }

    /**
     * Fix the type of each item in the given data object
     * @param ctx Request context
     * @param entity Entity name
     * @param dataObj Data object
     * @returns fixed data object
     */
    fixDataTypes(ctx: Context, entity: string, dataObj: INameValueMap): void
    {
        const fields = ctx.config.entities[entity].fields;
        for (const fieldName in fields)
        {
            if (!fields.hasOwnProperty(fieldName))
                continue;
            const fieldType = fields[fieldName].type;
            if (dataObj[fieldName] === null || typeof (dataObj[fieldName]) === "undefined")
                continue;
            if (fieldType === "int")
            {
                dataObj[fieldName] = parseInt(dataObj[fieldName]);
            }
            else if (fieldType === "float")
            {
                dataObj[fieldName] = parseFloat(dataObj[fieldName]);
            }
        }
    }


    /**
     * Resolve the foreign keys in the given request body
     * @param ctx Request context
     * @param requestBody Request body
     * @param dbAdapter Database adapter
     */
    async resolveForeignKeysAsync(ctx: Context, requestBody: INameValueMap, dbAdapter: IDatabase): Promise<any>
    {
        const fields = ctx.config.entities[ctx.entity].fields;
        const promises = [];
        for (const fieldName in fields)
        {
            if (!fields.hasOwnProperty(fieldName) || !fields[fieldName].foreignKey || !requestBody[fieldName])
                continue;
            const promise = this.resolveForeignKeyAsync(ctx, requestBody, fieldName, fields[fieldName].foreignKey, dbAdapter);
            promises.push(promise);
        }
        for (const promise of promises)
            await promise;
    }

    /**
     * Resolve a foreign key field in the given request body
     * @param ctx Request context
     * @param requestBody Request body
     * @param fieldName Field name
     * @param fk Foreign key object
     * @param dbAdapter Database adapter
     */
    async resolveForeignKeyAsync(ctx: Context, requestBody: INameValueMap, fieldName: string, fk: any, dbAdapter: IDatabase): Promise<any>
    {
        const record = await dbAdapter.findRecordByIdAsync(ctx, fk.foreignEntity, requestBody[fieldName]);
        requestBody[fk.resolvedKeyName] = this.fixDataKeysAndTypes(ctx, record);
    }

    /**
     * Check if array 1 contains any of array2 elements
     * @param arr1 first array
     * @param arr2 second array
     * @returns true if array 1 contains any of array 2 elements
     */
    containsAny(arr1: string[], arr2: string[]): boolean
    {
        let found = false;
        arr1.forEach(value =>
        {
            if (arr2.indexOf(value) >= 0)
                found = true;
        });
        return found;
    }
}

const helperService = new HelperService();
export { helperService };