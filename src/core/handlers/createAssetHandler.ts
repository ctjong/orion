import { execService } from "../services/execService";
import { helperService } from "../services/helperService";
import { dataService } from "../services/dataService";
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
    async execute(ctx:Context, req:any): Promise<void>
    {
        const dbAdapter = dataService.getDatabaseAdapter();
        const storageAdapter = dataService.getStorageAdapter();
        if (!ctx.config.storage)
            execService.throwError("e668", 500, "file upload is not supported for this site");
        if(!ctx.user.id) 
            execService.throwError("4f53", 401, "anonymous upload is not supported");
        await helperService.onBeginWriteRequest(ctx, "create", dbAdapter, null, { "ownerid": ctx.user.id });
        const { error, name } = await storageAdapter.uploadFile(ctx, req);
        if (error)
        {
            execService.sendErrorResponse(ctx, "d2d0", 500, "error while uploading file to storage system");
        }
        else
        {
            const insertedId = await dbAdapter.insert(ctx, "asset", ["ownerid", "filename"], [ctx.user.id, name]);
            ctx.res.send(insertedId.toString());
        }
    }
};

const createAssetHandler = new CreateAssetHandler();
export { createAssetHandler };