/**
 * A mock S3 provider module
 */
module.exports = 
{
    upload: function(options, callback)
    {
        //options={Bucket: ctx.config.storage.s3Bucket,Key: name,ACL: 'public-read',Body: stream,ContentLength: stream.byteCount,ContentType: _this.mime.lookup(name)}
        //callback=fn(err, data)
        //TODO
    },
    deleteObject: function(options, callback)
    {
        //options={Bucket: ctx.config.storage.s3Bucket,Key: name}
        //callback=fn(err, data)
        //TODO
    }
};