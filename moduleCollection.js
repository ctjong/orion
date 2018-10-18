/**
 * A module for managing all modules used in this application.
 */
module.exports = class ModuleCollection
{
    //----------------------------------------------
    // CONSTRUCTOR
    //----------------------------------------------

    /**
     * Construct the collection. This should be called on application start up.
     */
    constructor()
    {
        this.modules = {};
        this.moduleClasses = {};
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
    add(moduleName, modulePath)
    {
        this.modules[moduleName] = require(modulePath);
    }

    /**
     * Add a module definition to the collection. Modules added using this function
     * requires instantiation before use. This typically is used for adding Orion modules.
     * @param {any} moduleName Name to be used to access the module
     * @param {any} modulePath Path to the module definition to add
     */
    addClass(moduleName, moduleClassPath)
    {
        this.moduleClasses[moduleName] = require(moduleClassPath);
    }

    /**
     * Get the module registered under the given name. If the registered module has not
     * been instantiated, instantiate it first.
     * @param {any} moduleName Module name
     */
    get(moduleName)
    {
        let moduleObj = this.modules[moduleName];
        if(!moduleObj)
        {
            const moduleClass = this.moduleClasses[moduleName];
            if(!moduleClass)
                throw {tag: "99c0", statusCode: 500, msg: "module not found " + moduleName};
            moduleObj = new moduleClass();
            if(moduleName !== "exec")
            {
                moduleObj.exec = this.get("exec");
            }
            const dependencies = moduleObj.getDependencyNames();
            for(let i=0; i<dependencies.length; i++) 
            {
                const dpName = dependencies[i];
                moduleObj[dpName] = this.get(dpName);
            }
            this.modules[moduleName] = moduleObj;
        }
        return moduleObj;
    }
};


//----------------------------------------------
// PRIVATE
//----------------------------------------------

/**
 * Extend native JS functions to be used in this application. This should be called on 
 * application start up, so we are calling it from the constructor.
 */
const extendNativeFunctions = () =>
{
    String.prototype.format = function() 
    {
        const args = arguments;
        return this.replace(/{(\d+)}/g, (match, number) => 
        {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
    String.prototype.contains = function (substring)
    {
        return this.indexOf(substring) >= 0;
    };
    Array.prototype.contains = function (item)
    {
        return this.indexOf(item) >= 0;
    };
    Array.prototype.containsAny = function (array)
    {
        for(let i=0; i<array.length; i++)
        {
            if(!this.contains(array[i]))
                continue;
            return true;
        }
        return false;
    };
}