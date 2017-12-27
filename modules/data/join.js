module.exports = 
{
    dependencies: [],
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

        this.Join = function (e1, e2, e2Alias, e1JoinField, e2JoinField, e2SelectFields) 
        {
            this.getJoinExpression = function()
            {
                return "INNER JOIN [" + e2 + "table] [" + e2Alias + "] ON [" + e1 + "table].[" + e1JoinField + "] = [" + e2Alias + "].[" + e2JoinField + "]";
            };

            this.getSelectExpression = function()
            {
                var str = "";
                for(var i=0; i<e2SelectFields.length; i++)
                {
                    str += (str === "" ? "" : ", ") + "[" + e2Alias + "].[" + e2SelectFields[i] + "] AS [" + e2Alias + "_" + e2SelectFields[i] + "]";
                }
                return str;
            };
        };

        this.createForForeignKey = function(ctx, entity, field)
        {
            if(!entity || !field) throw "[Join.createForForeignKey] Missing entity/field";
            if(!ctx.config.entities[entity])
            {
                throw "[Join.createForForeignKey] invalid entity";
            }
            if(!ctx.config.entities[entity].fields[field])
            {
                throw "[Join.createForForeignKey] invalid field";
            }
            var fk = ctx.config.entities[entity].fields[field].foreignKey;
            var e2 = fk.foreignEntity;
            var e2SelectFields = [];
            var e2SelectFieldObjs = ctx.config.entities[e2].fields;
            for(var key in e2SelectFieldObjs)
            {
                if(!e2SelectFieldObjs.hasOwnProperty(key))
                    continue;
                if(e2SelectFieldObjs[key].type === "secret")
                    continue;
                e2SelectFields.push(key);
            }
            return new _this.Join(entity, e2, fk.resolvedKeyName, field, "id", e2SelectFields);
        };

        _construct();
    }
};