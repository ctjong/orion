import { execService } from "../services/execService";
import { helperService } from "../services/helperService";
import { Context } from "../types";

/**
 * Class that handles file upload operations
 */
class CreateAssetHandler
{
    /**
     * Handle a create asset (file upload) request
     * @param ctx Request context
     * @param req Request object
     */
    async executeAsync(ctx:Context, req:any): Promise<void>
    {
        if (!ctx.config.storage)
            execService.throwError("e668", 500, "file upload is not supported for this site");
        if(!ctx.user.id) 
            execService.throwError("4f53", 401, "anonymous upload is not supported");
        await helperService.onBeginWriteRequestAsync(ctx, "create", null, { "ownerid": ctx.user.id });
        const { error, name } = await ctx.storage.uploadFileAsync(ctx, req);
        if (error)
        {
            execService.sendErrorResponse(ctx, "d2d0", 500, "error while uploading file to storage system");
        }
        else
        {
            const insertedId = await ctx.db.insertAsync(ctx, "asset", ["ownerid", "filename"], [ctx.user.id, name]);
            ctx.res.json({ assetId: insertedId.toString(), fileName: name });
        }
    }
};

const createAssetHandler = new CreateAssetHandler();
export { createAssetHandler };