import { Context, INameValueMap } from "../types";
import { execService } from "./execService";

/**
 * A module containing utility/helper functions
 */
class HelperService
{
    /**
     * Get a list of enttiy fields to be used for the specified action. For read action,
     * this will include all fields in the config that is not marked as "secret".
     * For update action, this will include all fields that are marked as editable.
     * For any other action, this will return an empty array.
     * @param ctx Request context
     * @param action Action name
     * @param entityName Optional entity name. If not defined, the context entity will be used.
     * @returns an array of all-lowercased field names
     */
    getFields(ctx: Context, action: string, entityName?: string): string[]
    {
        if (!entityName)
            entityName = ctx.entityName;
        const fields = ctx.config.entities[entityName].fields;
        const allowedFields = [];
        for (const fieldName in fields)
        {
            if (!fields.hasOwnProperty(fieldName))
                continue;
            if (!(action === "read" && fields[fieldName].type === "secret") &&
                !(action === "update" && !fields[fieldName].isEditable))
            {
                allowedFields.push(fieldName.toLowerCase());
            }
        }
        return allowedFields;
    }

    /**
     * Fix the key name and type of each item in the given data object
     * @param ctx Request context
     * @param data Data object
     * @param entityName Entity name
     * @returns fixed data object
     */
    fixDataKeysAndTypes(ctx: Context, data: INameValueMap, entityName?: string): INameValueMap
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
        if (!entityName)
            entityName = ctx.entityName;
        this.fixDataTypes(ctx, entityName, newData);
        for (const newKey in newData)
        {
            if (!newData.hasOwnProperty(newKey) || !newData[newKey] || typeof (newData[newKey]) !== "object")
                continue;
            this.fixDataTypes(ctx, entityName, newData[newKey]);
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
     * @param recordId Record ID
     * @param requestBody Requset body
     */
    async onBeginWriteRequestAsync(ctx: Context, action: string, recordId: string, requestBody: INameValueMap): Promise<any>
    {
        requestBody = this.fixDataKeysAndTypes(ctx, requestBody);
        const isWriteAllowedFn = ctx.config.entities[ctx.entityName].isWriteAllowed;
        if (action === "create")
        {
            this.validateRoles(ctx, "create");
            requestBody = await this.resolveForeignKeysAsync(ctx, requestBody);
            if (isWriteAllowedFn && !isWriteAllowedFn(action, ctx.user.roles, ctx.user.id, null, requestBody))
                execService.throwError("c75f", 400, "bad create request. operation not allowed.");
            return { record: null, requestBody: requestBody };
        }
        else
        {
            let record = await ctx.db.findRecordByIdAsync(ctx, ctx.entityName, recordId);
            if (!record)
                execService.throwError("7e13", 400, "record not found with id " + recordId);
            record = this.fixDataKeysAndTypes(ctx, record);

            if ((ctx.entityName === "user" && ctx.user.id === record.id) || (ctx.entityName !== "user" && ctx.user.id === record.ownerid))
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
        if (!this.containsAny(ctx.config.entities[ctx.entityName].allowedRoles[action], ctx.user.roles))
            execService.throwError("c327", 401, "Unauthorized");
    }

    /**
     * Fix the type of each item in the given data object
     * @param ctx Request context
     * @param entityName Entity name
     * @param dataObj Data object
     * @returns fixed data object
     */
    fixDataTypes(ctx: Context, entityName: string, dataObj: INameValueMap): void
    {
        const fields = ctx.config.entities[entityName].fields;
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
     */
    async resolveForeignKeysAsync(ctx: Context, requestBody: INameValueMap): Promise<any>
    {
        const fields = ctx.config.entities[ctx.entityName].fields;
        const promises = [];
        for (const fieldName in fields)
        {
            if (!fields.hasOwnProperty(fieldName) || !fields[fieldName].foreignKey || !requestBody[fieldName])
                continue;
            const promise = this.resolveForeignKeyAsync(ctx, requestBody, fieldName, fields[fieldName].foreignKey);
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
     */
    async resolveForeignKeyAsync(ctx: Context, requestBody: INameValueMap, fieldName: string, fk: any): Promise<any>
    {
        const record = await ctx.db.findRecordByIdAsync(ctx, fk.targetEntityName, requestBody[fieldName]);
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