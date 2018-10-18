const Module = require("../module");

/**
 * A module to handle file deletion operations
 */
module.exports = class DeleteAssetHandler extends Module
{
    /**
     * Get a list of dependency names for this module
     */
    getDependencyNames()
    {
        return ["storage", "helper", "db"];
    }

    /**
     * Handle a delete asset (file deletion) request
     * @param {any} ctx Request context
     * @param {any} recordId Record ID of the asset to delete
     */
    execute (ctx, recordId)
    {
        if (!ctx.config.storage)
            this.exec.throwError("51be", 500, "file delete is not supported for this site");
        if(!ctx.userId)
            this.exec.throwError("2c74", 401, "anonymous asset deletion is not supported");
        this.helper.onBeginWriteRequest(ctx, "delete", this.db, recordId, null, (record, requestBody) =>
        {
            if (!record.filename)
                this.exec.throwError("cd03", 500, "failed to get file name for the requested record");
            this.storage.deleteFile(ctx, record.filename, (error) =>
            {
                if (error)
                {
                    this.exec.sendErrorResponse(ctx, "2020", 500, "Asset removal failed: " + error);
                }
                else
                {
                    this.db.deleteRecord(ctx, "asset", recordId, (dbResponse) =>
                    { 
                        ctx.res.send("Asset removed");
                    });
                }
            });
        });
    }
};