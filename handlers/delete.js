/**
 * A module to handle delete operations
 */
module.exports =
{
    dependencies: ["auth", "db", "helper"],
    Instance: function()
    {
        const _this = this;

        //----------------------------------------------
        // CONSTRUCTOR
        //----------------------------------------------

        function _construct(){}

        //----------------------------------------------
        // PUBLIC
        //----------------------------------------------

        /**
         * Handle a delete record request
         * @param {any} ctx Request context
         * @param {any} recordId Record ID to delete
         */
        function execute(ctx, recordId)
        {
            _this.helper.onBeginWriteRequest(ctx, "delete", _this.db, recordId, null, function(record, requestBody)
            {
                if(ctx.entity === "user" && record.domain !== "local")
                    _this.exec.throwError("d789", 400, "updating external user info is not supported");
                _this.db.deleteRecord(ctx, ctx.entity, recordId, function(dbResponse)
                {
                    ctx.res.send(dbResponse);
                });
            });
        }

        this.execute = execute;
        _construct();
    }
};