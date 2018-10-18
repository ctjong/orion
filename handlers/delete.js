const Module = require("../module");

/**
 * A module to handle delete operations
 */
module.exports = class DeleteHandler extends Module
{
    /**
     * Get a list of dependency names for this module
     */
    getDependencyNames()
    {
        return ["auth", "helper", "db"];
    }

    /**
     * Handle a delete record request
     * @param {any} ctx Request context
     * @param {any} recordId Record ID to delete
     */
    execute(ctx, recordId)
    {
        this.helper.onBeginWriteRequest(ctx, "delete", this.db, recordId, null, (record, requestBody) =>
        {
            if(ctx.entity === "user" && record.domain !== "local")
                this.exec.throwError("d789", 400, "updating external user info is not supported");
            this.db.deleteRecord(ctx, ctx.entity, recordId, (dbResponse) =>
            {
                ctx.res.send(dbResponse);
            });
        });
    }
};