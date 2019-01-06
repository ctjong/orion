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
        const writeValidatorFn = ctx.config.entities[ctx.entityName].writeValidator;
        if (action === "create")
        {
            this.validateRoles(ctx, "create");
            requestBody = await this.resolveForeignKeysAsync(ctx, requestBody);
            if (writeValidatorFn && !writeValidatorFn(action, ctx.user.roles, ctx.user.id, null, requestBody))
                execService.throwError("c75f", 400, "bad create request. operation not allowed.");
            return { record: null, requestBody: requestBody };
        }
        else
        {
            let record = await ctx.db.findRecordByIdAsync(ctx, ctx.entityName, recordId);
            if (!record)
                execService.throwError("7e13", 400, "record not found with id " + recordId);

            if ((ctx.entityName === "user" && ctx.user.id === record.id) || (ctx.entityName !== "user" && ctx.user.id === record.ownerid))
                ctx.user.roles.push("owner");
            this.validateRoles(ctx, action);

            if (writeValidatorFn && !writeValidatorFn(action, ctx.user.roles, ctx.user.id, record, requestBody))
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
        if (!this.containsAny(ctx.config.entities[ctx.entityName].permissions[action], ctx.user.roles))
            execService.throwError("c327", 401, "Unauthorized");
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

            const promise = new Promise(async resolve =>
            {
                const fk = fields[fieldName].foreignKey;
                requestBody[fk.resolvedEntityName] = await ctx.db.findRecordByIdAsync(ctx, fk.targetEntityName, requestBody[fieldName]);
                resolve();
            });
            promises.push(promise);
        }
        for (const promise of promises)
            await promise;
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