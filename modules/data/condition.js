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

        this.Condition = function (entity, fieldName, operator, fieldValue) 
        {
            this.getValue = function(conditionKey)
            {
                return fieldName === conditionKey ? fieldValue : null;
            };
            this.getWhereExpression = function(queryObj)
            {
                if(fieldName === "1" && fieldValue === "1")
                {
                    return "1=1";
                }
                else if(operator === "~")
                {
                    return "[" + entity + "table].[" + fieldName + "] like '%" + fieldValue + "%'";
                }
                else if(typeof(fieldValue) === "string" && fieldValue.toLowerCase() === "null")
                {
                    if(operator == "=")
                    {
                        return "[" + entity + "table].[" + fieldName + "] is null";
                    }
                    else
                    {
                        return "[" + entity + "table].[" + fieldName + "] is not null";
                    }
                }
                else
                {
                    return "[" + entity + "table].[" + fieldName + "]" + operator + queryObj.addQueryParam(fieldValue);
                }
            };
        };

        this.CompoundCondition = function (operator, children) 
        {
            this.children = children;
            this.getValue = function(conditionKey)
            {
                for(var i=0; i<children.length; i++)
                {
                    var val = children[i].getValue(conditionKey);
                    if(val !== null) return val;
                }
                return null;
            };
            this.getWhereExpression = function(queryObj)
            {
                if (!children)
                    return "1=1";
                var str = "(";
                for(var i=0; i<children.length; i++)
                {
                    var cond = children[i];
                    if(i > 0) str += operator === "&" ? " AND " : " OR ";
                    str += cond.getWhereExpression(queryObj);
                }
                str += ")";
                return str;
            };
        };

        this.parse = function(ctx, conditionString)
        {
            var condition = new _this.CompoundCondition("&", []);
            if(conditionString === "") 
            {
                condition.children.push(new _this.Condition(null,"1","=","1"));
            }
            else if(conditionString.contains("&") || conditionString.contains("|"))
            {
                var andCondStrs = conditionString.split("&");
                for(var i=0; i<andCondStrs.length; i++)
                {
                    if(!andCondStrs[i]) continue;
                    var orConds = [];
                    var orCondStrs  = andCondStrs[i].split("|");
                    for(var j=0; j<orCondStrs.length; j++)
                    {
                        if(!orCondStrs[j]) continue;
                        orConds.push(_this.parse(ctx, orCondStrs[j]));
                    }
                    condition.children.push(new _this.CompoundCondition("|", orConds));
                }
            }
            else
            {
                var operands = null;
                var operator = null;
                var fieldValue = null;
                var operators = ["~", "<>", "<=", ">=", "<", ">", "="];
                for(var i=0; i<operators.length; i++)
                {
                    if(conditionString.contains(operators[i]))
                    {
                        operands = conditionString.split(operators[i]);
                        operator = operators[i];
                        break;
                    }
                }
                if(!operands || operands.length < 2)
                    return null;
                var fieldName = operands[0];
                var fields = ctx.config.entities[ctx.entity].fields;
                if(!fields.hasOwnProperty(fieldName))
                {
                    throw new _this.error.Error("9d1b", 400, "unrecognized field " + fieldName + " found in condition");
                }
                var fieldType = ctx.config.entities[ctx.entity].fields[fieldName].type;
                if(fieldType === "int") 
                {
                    fieldValue = parseInt(operands[1]);
                }
                else if(fieldType === "float")
                {
                    fieldValue = parseFloat(operands[1]);
                }
                else
                {
                    fieldValue = operands[1];
                }
                condition.children.push(new _this.Condition(ctx.entity, fieldName, operator, fieldValue));
            }
            return condition;
        };

        _construct();
    }
};