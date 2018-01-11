/**
 * A factory for creating Context objects, which will store all details about the current session.
 */
var factory = 
{
    Config: null,
    Context: function(req, res, entity) 
    {
        var _this = this;
        var errorObj = null;

        //----------------------------------------------
        // CONSTRUCTOR
        //----------------------------------------------

        /**
         * Construct a new Context object. This should be done at the beginning of each session.
         */
        function _construct()
        {
            try
            {
                _this.req = req;
                _this.res = res;
                _this.entity = entity;
                if(!_this.config.entities.hasOwnProperty(_this.entity)) 
                {
                    throw {"tag": "1a83", "statusCode": 400, "msg": "invalid entity " + _this.entity};
                }
            }
            catch(ex2)
            {
                errorObj = ex2;
            }
            if(errorObj)
                throw errorObj;
        }

        //----------------------------------------------
        // PUBLIC
        //----------------------------------------------

        this.config = factory.Config;
        this.req = null;
        this.res = null;
        this.entity = null;
        this.userId = null;
        this.userName = null;
        this.userRoles = [];
        this.userDomain = null;
        _construct();
    }
};

module.exports = factory;