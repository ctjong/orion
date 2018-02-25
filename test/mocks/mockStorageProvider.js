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

    /**
     * Upload a file to an Azure blob storage
     * @param {*} containerName azure container name
     * @param {*} name  file name
     * @param {*} stream file stream
     * @param {*} size file size
     * @param {*} options upload options
     * @param {*} callback callback function
     */
    function azureCreateBlockBlobFromStream(containerName, name, stream, size, options, callback)
    {
        //options={contentSettings: { contentType: _this.mime.lookup(name) }}
        //callback=fn(err)
        //TODO
    }

    /**
     * Delete a file from an Azure blob storage
     * @param {*} containerName azure container name
     * @param {*} filename file name
     * @param {*} callback callback function
     */
    function azureDeleteBlob(containerName, filename, callback)
    {
        //callback=fn(err, response)
        //TODO
    }

    /**
     * Upload a file to an Amazon S3 storage
     * @param {*} options upload options
     * @param {*} callback callback function
     */
    function s3Upload(options, callback)
    {
        //options={Bucket: ctx.config.storage.s3Bucket,Key: name,ACL: 'public-read',Body: stream,ContentLength: stream.byteCount,ContentType: _this.mime.lookup(name)}
        //callback=fn(err, data)
        //TODO
    }

    /**
     * Delete a file from an Amazon S3 storage
     * @param {*} options delete options
     * @param {*} callback callback function
     */
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