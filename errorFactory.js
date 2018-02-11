/**
 * A factory for creating Error objects, which will hold all details about an error.
 */
module.exports = 
{
    dependencies: [],
    Instance: function()
    {
        var _this = this;

        //----------------------------------------------
        // CONSTRUCTOR
        //----------------------------------------------

        function _construct() { }

        //----------------------------------------------
        // PUBLIC
        //----------------------------------------------

        /**
         * Construct a new Error object. This will contain all details about an error.
         */
        function Error(tag, statusCode, msg)
        {
            this.tag = tag;
            this.statusCode = statusCode;
            this.msg = msg;
        }

        /**
         * Parse an error string and construct a new Error object.
         */
        function parse(errorStr)
        {
            return new _this.Error("", 500, errorStr);
        }

        this.Error = Error;
        this.parse = parse;
        _construct();
    }
};