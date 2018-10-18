/**
 * A module for handling query conditions
 */
module.exports = 
{
    dependencies: [],
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
         * Construct a new Condition object
         * @param {any} entity Entity where this condition applies to
         * @param {any} fieldName Condition field
         * @param {any} operator Condition operator
         * @param {any} fieldValue Condition value
         */
        function Condition(entity, fieldName, operator, fieldValue) 
        {
            this.entity = entity;
            this.fieldName = fieldName;
            this.operator = operator;
            this.fieldValue = fieldValue;
            this.getValue = function(conditionKey)
            {
                return fieldName === conditionKey ? fieldValue : null;
            };
        }

        /**
         * Construct a Condition that consists of other Conditions
         * @param {any} operator Operator to connect all the child conditions
         * @param {any} children Array of Conditions
         */
        function CompoundCondition(operator, children) 
        {
            this.operator = operator;
            this.children = children;
            this.getValue = function(conditionKey)
            {
                for(let i=0; i<children.length; i++)
                {
                    const val = children[i].getValue(conditionKey);
                    if(val !== null) return val;
                }
                return null;
            };
        }

        /**
         * Try to parse the given condition string and return a Condition object
         * @param {any} ctx Requst context
         * @param {any} conditionString Condition string
         * @returns Condition object, or null on failure
         */
        function parse(ctx, conditionString)
        {
            const condition = new _this.CompoundCondition("&", []);
            if(conditionString === "") 
            {
                condition.children.push(new _this.Condition(null,"1","=","1"));
            }
            else if(conditionString.contains("&") || conditionString.contains("|"))
            {
                const andCondStrs = conditionString.split("&");
                for(let i=0; i<andCondStrs.length; i++)
                {
                    if(!andCondStrs[i]) continue;
                    const orConds = [];
                    const orCondStrs  = andCondStrs[i].split("|");
                    for(let j=0; j<orCondStrs.length; j++)
                    {
                        if(!orCondStrs[j]) continue;
                        orConds.push(_this.parse(ctx, orCondStrs[j]));
                    }
                    condition.children.push(new _this.CompoundCondition("|", orConds));
                }
            }
            else
            {
                let operands = null;
                let operator = null;
                let fieldValue = null;
                const operators = ["~", "<>", "<=", ">=", "<", ">", "="];
                for(let i=0; i<operators.length; i++)
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
                const fieldName = operands[0];
                const fields = ctx.config.entities[ctx.entity].fields;
                if(!fields.hasOwnProperty(fieldName))
                {
                    _this.exec.throwError("9d1b", 400, "unrecognized field " + fieldName + " found in condition");
                }
                const fieldType = ctx.config.entities[ctx.entity].fields[fieldName].type;
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
        }

        this.Condition = Condition;
        this.CompoundCondition = CompoundCondition;
        this.parse = parse;
        _construct();
    }
};