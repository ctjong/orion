/**
 * A mock azure blob storage provider module
 */
module.exports = 
{
    createBlockBlobFromStream: function(containerName, name, stream, size, options, callback)
    {
        //options={contentSettings: { contentType: _this.mime.lookup(name) }}
        //callback=fn(err)
        //TODO
    },
    deleteBlob: function(containerName, filename, callback)
    {
        //callback=fn(err, response)
        //TODO
    }
};