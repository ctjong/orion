module.exports = 
{
    dependencies: ["auth", "db", "helper"],
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

        this.execute = function(ctx, resourceId)
        {
            _this.helper.validate(ctx, "delete", _this.db, resourceId, null, function(resource, requestBody)
            {
                if(ctx.entity === "user" && resource.domain !== "local")
                    throw new _this.error.Error("d789", 400, "updating external user info is not supported");
                _this.db.delete(ctx, ctx.entity, resourceId, function(dbResponse)
                {
                    ctx.res.send(dbResponse);
                });
            });
        };

        _construct();
    }
};