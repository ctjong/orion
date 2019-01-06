import { Context, INameValueMap, CompoundCondition } from "../types";
import { execService } from "../services/execService";
import { helperService } from "../services/helperService";
import { conditionFactory } from "../services/conditionFactory";

/**
 * Class that handles read operations
 */
class ReadHandler
{
    /**
     * Handle a read request
     * @param ctx Request context
     * @param requestParams Request parameters
     * @param isFullMode Whether to do the read in full mode (full mode = include rich text fields in response)
     */
    async executeAsync(ctx: Context, requestParams: INameValueMap, isFullMode: boolean): Promise<void>
    {
        // set owner role if the read operation is run in private mode
        if (requestParams.accessType === "private")
        {
            // private read mode. add owner role directly, add ownerid condition later
            if (!ctx.user.id)
                execService.throwError("a058", 401, "Unauthorized");
            ctx.user.roles.push("owner");
        }

        // verify that current user context is allowed to execute a read
        helperService.validateRoles(ctx, "read");

        // get pagination and ordering info
        const skip = isNaN(parseInt(requestParams.skip)) ? 0 : parseInt(requestParams.skip);
        const take = isNaN(parseInt(requestParams.take)) ? 10 : parseInt(requestParams.take);
        const orderByField = !requestParams.orderByField ? "id" : requestParams.orderByField;

        // get condition
        const configConditionStr = this.getConditionStringFromConfig(ctx);
        const condition = this.getConditionFromRequest(ctx, requestParams);
        if (configConditionStr !== "") 
        {
            condition.children.push(conditionFactory.parse(ctx, configConditionStr));
        }

        // execute
        const fields = helperService.getFields(ctx, "read");
        const count = await ctx.db.countAsync(ctx, ctx.entityName, condition);
        const dbResponse = await ctx.db.selectAsync(ctx, fields, ctx.entityName, condition, orderByField, skip, take);
        ctx.res.json({ "count": count, "items": dbResponse });
    }

    /**
     * Get condition string from config
     * @param ctx Request context
     * @returns condition string
     */
    private getConditionStringFromConfig(ctx: Context): string
    {
        const entityConfig = ctx.config.entities[ctx.entityName];
        if (!entityConfig.readValidator)
            return "";
        return entityConfig.readValidator(ctx.user.roles, ctx.user.id);
    }

    /**
     * Get condition object from the request
     * @param ctx Request context
     * @param requestParams Request parameters
     * @param conditionFactory Condition factory
     * @param exec Exec module
     * @returns Condition object
     */
    private getConditionFromRequest(ctx: Context, requestParams: INameValueMap): CompoundCondition
    {
        const isPrivate = requestParams.accessType === "private";
        const condition = conditionFactory.createCompound("&", []);
        if (requestParams.condition)
        {
            const conditionString = decodeURIComponent(requestParams.condition);
            condition.children.push(conditionFactory.parse(ctx, conditionString));
        }
        else if (requestParams.id)
        {
            condition.children.push(conditionFactory.createSingle(ctx.entityName, "id", "=", requestParams.id));
        }
        if (isPrivate)
        {
            const fieldName = ctx.entityName === "user" ? "id" : "ownerid";
            condition.children.push(conditionFactory.createSingle(ctx.entityName, fieldName, "=", ctx.user.id));
        }
        return condition;
    }
}

const readHandler = new ReadHandler();
export { readHandler };