/**
 * A module for managing all modules used in this application.
 */
module.exports = function ()
{
    var _this = this;
    var modules = {};
    var moduleDefs = {};

    //----------------------------------------------
    // CONSTRUCTOR
    //----------------------------------------------

    /**
     * Construct the collection. This should be called on application start up.
     */
    function _construct()
    {
        extendNativeFunctions();
    }

    //----------------------------------------------
    // PUBLIC
    //----------------------------------------------

    /**
     * Add an initialized module to the collection. Modules added using this function
     * do not require any instantiation. This typically is used for adding third party modules.
     * @param {any} moduleName Name to be used to access the module
     * @param {any} modulePath Path to the module to add
     */
    function add(moduleName, modulePath)
    {
        modules[moduleName] = require(modulePath);
    }

    /**
     * Add a module definition to the collection. Modules added using this function
     * requires instantiation before use. This typically is used for adding first party modules.
     * @param {any} moduleName Name to be used to access the module
     * @param {any} modulePath Path to the module definition to add
     */
    function addDef(moduleName, moduleDefPath)
    {
        moduleDefs[moduleName] = require(moduleDefPath);
    }

    /**
     * Get the module registered under the given name. If the registered module has not
     * been instantiated, instantiate it first.
     * @param {any} moduleName Module name
     */
    function get(moduleName)
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
    }

    //----------------------------------------------
    // PRIVATE
    //----------------------------------------------

    /**
     * Extend native JS functions to be used in this application. This should be called on 
     * application start up, so we are calling it from the constructor.
     */
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

    this.add = add;
    this.addDef = addDef;
    this.get = get;
    _construct();
};