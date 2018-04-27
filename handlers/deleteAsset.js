/**
 * A module to handle file deletion operations
 */
module.exports = 
{
    dependencies: ["storage", "helper", "db"],
    Instance: function()
    {
        var _this = this;

        //----------------------------------------------
        // CONSTRUCTOR
        //----------------------------------------------

        function _construct(){}

        //----------------------------------------------
        // PUBLIC
        //----------------------------------------------

        /**
         * Handle a delete asset (file deletion) request
         * @param {any} ctx Request context
         * @param {any} recordId Record ID of the asset to delete
         */
        function execute (ctx, recordId)
        {
            if (!ctx.config.storage)
                throw new _this.exec.Error("51be", 500, "file delete is not supported for this site");
            if(!ctx.userId)
                throw new _this.exec.Error("2c74", 401, "anonymous asset deletion is not supported");
            _this.helper.onBeginWriteRequest(ctx, "delete", _this.db, recordId, null, function(record, requestBody)
            {
                if (!record.filename)
                    throw new _this.exec.Error("cd03", 500, "failed to get file name for the requested record");
                _this.storage.deleteFile(ctx, record.filename, function (error) 
                {
                    _this.exec.safeExecute(ctx, function()
                    {
                        if (error)
                        {
                            throw new _this.exec.Error("2020", 500, "Asset removal failed: " + error);
                        }
                        else
                        {
                            _this.db.deleteRecord(ctx, "asset", recordId, function(dbResponse)
                            { 
                                ctx.res.send("Asset removed");
                            });
                        }
                    });
                });
            });
        }

        this.execute = execute;
        _construct();
    }
};