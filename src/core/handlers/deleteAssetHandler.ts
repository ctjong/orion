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
    async executeAsync(ctx:Context, recordId:string): Promise<void>
    {
        const dbAdapter = dataService.getDatabaseAdapter();
        const storageAdapter = dataService.getStorageAdapter();
        if (!ctx.config.storage)
            execService.throwError("51be", 500, "file delete is not supported for this site");
        if(!ctx.user.id)
            execService.throwError("2c74", 401, "anonymous asset deletion is not supported");
        const { record } = await helperService.onBeginWriteRequestAsync(ctx, "delete", dbAdapter, recordId, null);
        if (!record.filename)
            execService.throwError("cd03", 500, "failed to get file name for the requested record");
        const error = await storageAdapter.deleteFileAsync(ctx, record.filename);
        if (error)
        {
            execService.sendErrorResponse(ctx, "2020", 500, "Asset removal failed: " + error);
        }
        else
        {
            await dbAdapter.deleteRecordAsync(ctx, "asset", recordId);
            ctx.res.send("Asset removed");
        }
    }
};

const deleteAssetHandler = new DeleteAssetHandler();
export { deleteAssetHandler };