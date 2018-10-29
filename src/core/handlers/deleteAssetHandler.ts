import { Context } from "../types";
import { execService } from "../services/execService";
import { dataService } from "../services/dataService";
import { helperService } from "../services/helperService";

/**
 * Class that handles file deletion operations
 */
class DeleteAssetHandler
{
    /**
     * Handle a delete asset (file deletion) request
     * @param ctx Request context
     * @param recordId Record ID of the asset to delete
     */
    async execute (ctx:Context, recordId:string): Promise<void>
    {
        if (!ctx.config.storage)
            execService.throwError("51be", 500, "file delete is not supported for this site");
        if(!ctx.user.id)
            execService.throwError("2c74", 401, "anonymous asset deletion is not supported");
        const { record } = await helperService.onBeginWriteRequest(ctx, "delete", dataService.db, recordId, null);
        if (!record.filename)
            execService.throwError("cd03", 500, "failed to get file name for the requested record");
        const error = await dataService.storage.deleteFile(ctx, record.filename);
        if (error)
        {
            execService.sendErrorResponse(ctx, "2020", 500, "Asset removal failed: " + error);
        }
        else
        {
            await dataService.db.deleteRecord(ctx, "asset", recordId);
            ctx.res.send("Asset removed");
        }
    }
};

const deleteAssetHandler = new DeleteAssetHandler();
export { deleteAssetHandler };