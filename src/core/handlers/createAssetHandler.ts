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
    async execute(ctx:Context, req:any)
    {
        if (!ctx.config.storage)
            execService.throwError("e668", 500, "file upload is not supported for this site");
        if(!ctx.user.id) 
            execService.throwError("4f53", 401, "anonymous upload is not supported");
        await helperService.onBeginWriteRequest(ctx, "create", dataService.db, null, { "ownerid": ctx.user.id });
        const { error, name } = await dataService.storage.uploadFile(ctx, req);
        if (error)
        {
            execService.sendErrorResponse(ctx, "d2d0", 500, "error while uploading file to storage system");
        }
        else
        {
            const insertedId = await dataService.db.insert(ctx, "asset", ["ownerid", "filename"], [ctx.user.id, name]);
            ctx.res.send(insertedId.toString());
        }
    }
};

const createAssetHandler = new CreateAssetHandler();
export { createAssetHandler };