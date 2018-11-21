import { Context, INameValueMap } from "../types";
import { helperService } from "../services/helperService";
import { execService } from "../services/execService";
import { conditionFactory } from "../services/conditionFactory";

/**
 * Class that handles update operations
 */
class UpdateHandler
{
    /**
     * Handle an update request
     * @param ctx Request context
     * @param requestBody Request body
     * @param recordId Record ID to update
     */
    async executeAsync(ctx:Context, requestBody:INameValueMap, recordId:string): Promise<void>
    {
        const { record } = await helperService.onBeginWriteRequestAsync(ctx, "update", recordId, requestBody);
        const updateData:INameValueMap = {};
        const fields = helperService.getFields(ctx, "update");
        for(let i=0; i<fields.length; i++)
        {
            const fieldName = fields[i];
            if(!requestBody.hasOwnProperty(fieldName)) continue;
            updateData[fieldName] = requestBody[fieldName];
        }
        if(Object.keys(updateData).length === 0)
        {
            execService.throwError("582e", 400, "bad request");
        }
        if(ctx.entityName === "user" && record.domain !== "local") 
        {
            execService.throwError("511f", 400, "updating external user info is not supported");
        }
        const condition = conditionFactory.createSingle(ctx.entityName, "id", "=", recordId);
        const dbResponse = await ctx.db.updateAsync(ctx, ctx.entityName, updateData, condition);
        ctx.res.send(dbResponse);
    }
}

const updateHandler = new UpdateHandler();
export { updateHandler };