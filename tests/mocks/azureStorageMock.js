/**
 * A mock azure blob storage adapter module
 */
module.exports = 
{
    createBlobService: function(connectionString)
    {
        this.createBlockBlobFromStream = function(containerName, name, stream, size, options, callback)
        {
            //options={contentSettings: { contentType: _this.mime.lookup(name) }}
            //callback=fn(err)
            //TODO
        };
        this.deleteBlob = function(containerName, filename, callback)
        {
            //callback=fn(err, response)
            //TODO
        };
    }
};