/**
 * Base class for a module
 */
module.exports = class Module
{
    /**
     * Get a list of dependency names for this module
     */
    getDependencyNames()
    {
        throw "not implemented";
    }
}