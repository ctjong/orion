module.exports = function()
{
    var _this = this;
    var modules = {};
    var moduleDefs = {};

    //----------------------------------------------
    // CONSTRUCTOR
    //----------------------------------------------

    function _construct()
    {
        extendNativeFunctions();
    }

    //----------------------------------------------
    // PUBLIC
    //----------------------------------------------

    this.add = function(moduleName, modulePath)
    {
        modules[moduleName] = require(modulePath);
    };

    this.addDef = function(moduleName, moduleDefPath)
    {
        moduleDefs[moduleName] = require("../" + moduleDefPath);
    };

    this.get = function(moduleName)
    {
        var module = modules[moduleName];
        if(!module)
        {
            var moduleDef = moduleDefs[moduleName];
            if(!moduleDef)
                throw {tag: "99c0", statusCode: 500, msg: "module not found " + moduleName};
            module = new moduleDef.Instance();
            if(moduleName !== "error")
                module.error = new _this.get("error");
            var dependencies = moduleDef.dependencies;
            for(var i=0; i<dependencies.length; i++) 
            {
                var dpName = dependencies[i];
                module[dpName] = _this.get(dpName);
            }
            modules[moduleName] = module;
        }
        return module;
    };

    //----------------------------------------------
    // PRIVATE
    //----------------------------------------------

    function extendNativeFunctions() 
    {
        String.prototype.format = function() 
        {
            var args = arguments;
            return this.replace(/{(\d+)}/g, function(match, number) 
            {
                return typeof args[number] != 'undefined' ? args[number] : match;
            });
        };
        String.prototype.contains = function(substring)
        {
            return this.indexOf(substring) >= 0;
        };
        Array.prototype.contains = function(item) 
        {
            return this.indexOf(item) >= 0;
        };
        Array.prototype.containsAny = function(array) 
        {
            for(var i=0; i<array.length; i++)
            {
                if(!this.contains(array[i]))
                    continue;
                return true;
            }
            return false;
        };
    }

    _construct();
};