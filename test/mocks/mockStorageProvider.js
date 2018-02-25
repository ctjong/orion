/**
 * A mock storage provider module
 */
var mock = function(provider)
{
    //----------------------------------------------
    // CONSTRUCTOR
    //----------------------------------------------

    function _construct() { }

    //----------------------------------------------
    // PUBLIC
    //----------------------------------------------

    function azureCreateBlockBlobFromStream(containerName, name, stream, size, options, callback)
    {
        //options={contentSettings: { contentType: _this.mime.lookup(name) }}
        //callback=fn(err)
        //TODO
    }

    function azureDeleteBlob(containerName, filename, callback)
    {
        //callback=fn(err, response)
        //TODO
    }

    function s3Upload(options, callback)
    {
        //options={Bucket: ctx.config.storage.s3Bucket,Key: name,ACL: 'public-read',Body: stream,ContentLength: stream.byteCount,ContentType: _this.mime.lookup(name)}
        //callback=fn(err, data)
        //TODO
    }

    function s3DeleteObject(options, callback)
    {
        //options={Bucket: ctx.config.storage.s3Bucket,Key: name}
        //callback=fn(err, data)
        //TODO
    }

    this.createBlockBlobFromStream = azureCreateBlockBlobFromStream;
    this.deleteBlob = azureDeleteBlob;
    this.upload = s3Upload;
    this.deleteObject = s3DeleteObject;
    _construct();
};

module.exports = mock;