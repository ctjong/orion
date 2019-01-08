import { Context } from "../types";
import { execService } from "../services/execService";
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
    async executeAsync(ctx: Context, recordId: string): Promise<void>
    {
        if (!ctx.config.storage)
            execService.throwError("51be", 500, "file delete is not supported for this site");
        if (!ctx.user.id)
            execService.throwError("2c74", 401, "anonymous asset deletion is not supported");
        const { record } = await helperService.onBeginWriteRequestAsync(ctx, "delete", recordId, null);
        if (!record.filename)
            execService.throwError("cd03", 500, "failed to get file name for the requested record");

        const dbError = await ctx.db.deleteRecordAsync(ctx, "asset", recordId);
        if (dbError)
            execService.throwError("2020", 500, "Failed to remove asset from DB: " + dbError);

        const storageError = await this.deleteFileAsync(ctx, record.filename);
        if (storageError)
            execService.throwError("mgwy", 500, "Failed to remove asset from storage: " + storageError);

        ctx.res.send("Asset removed");
    }

    /**
     * Delete a file from the storage
     * @param ctx Request context 
     * @param filename File name
     * @returns upload error if any
     */
    private deleteFileAsync(ctx: Context, filename: string): Promise<any>
    {
        const provider = ctx.config.storage.provider;
        if (provider === "azure")
        {
            return ctx.storage.azureDeleteAsync(ctx.config.storage.azureStorageContainerName, filename);
        }
        else if (provider === "s3")
        {
            return ctx.storage.s3DeleteAsync(
                {
                    Key: filename,
                    Bucket: ctx.config.storage.s3Bucket
                });
        }
        else if (provider === "local")
        {
            const fullPath = ctx.config.storage.uploadPath + "/" + filename;
            return ctx.storage.localDeleteAsync(fullPath);
        }
        else if (provider === "custom")
        {
            return ctx.storage.customDeleteAsync(name);
        }
        else
        {
            throw `Unknown provider: ${provider}`;
        }
    }
};

const deleteAssetHandler = new DeleteAssetHandler();
export { deleteAssetHandler };