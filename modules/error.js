module.exports = 
{
    dependencies: [],
    Instance: function()
    {
        var _this = this;

        this.Error = function(tag, statusCode, msg)
        {
            this.tag = tag;
            this.statusCode = statusCode;
            this.msg = msg;
        };

        this.parse = function(errorStr)
        {
            return new _this.Error("", 500, errorStr);
        };
    }
};