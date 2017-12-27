module.exports = {
    dependencies: ["auth", "helper", "condition", "db"],
    Instance: function(){
        var _this = this;

        //----------------------------------------------
        // CONSTRUCTOR
        //----------------------------------------------

        function _construct(){}

        //----------------------------------------------
        // PUBLIC
        //----------------------------------------------

        this.execute = function(ctx, requestBody, resourceId)
        {
            _this.helper.validate(ctx, "update", _this.db, resourceId, requestBody, function(resource, requestBody)
            {
                var updateData = {};
                var fields = _this.helper.getFields(ctx, "update");
                for(var i=0; i<fields.length; i++)
                {
                    var fieldName = fields[i];
                    if(!requestBody.hasOwnProperty(fieldName)) continue;
                    updateData[fieldName] = requestBody[fieldName];
                }
                if(Object.keys(updateData).length === 0)
                {
                    throw new _this.error.Error("582e", 400, "bad request");
                }
                if(ctx.entity === "user" && resource.domain !== "local") 
                {
                    throw new _this.error.Error("511f", 400, "updating external user info is not supported");
                }
                var condition = new _this.condition.Condition(ctx.entity, "id", "=", resourceId);
                _this.db.update(ctx, ctx.entity, updateData, condition, function(dbResponse)
                {
                    ctx.res.send(dbResponse);
                });
            });
        };

        _construct();
    }
};