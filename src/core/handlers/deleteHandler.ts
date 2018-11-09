import { Context } from "../types";
import { helperService } from "../services/helperService";
import { execService } from "../services/execService";

/**
 * Class that handles delete operations
 */
class DeleteHandler
{
    /**
     * Handle a delete record request
     * @param ctx Request context
     * @param recordId Record ID to delete
     */
    async executeAsync(ctx:Context, recordId:string): Promise<void>
    {
        const { record } = await helperService.onBeginWriteRequestAsync(ctx, "delete", recordId, null);
        if(ctx.entity === "user" && record.domain !== "local")
            execService.throwError("d789", 400, "updating external user info is not supported");
        const dbResponse = await ctx.db.deleteRecordAsync(ctx, ctx.entity, recordId);
        ctx.res.send(dbResponse);
    }
};

const deleteHandler = new DeleteHandler();
export { deleteHandler };