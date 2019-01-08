import { execService } from "../services/execService";
import { helperService } from "../services/helperService";
import { Context, IUploadFileResponse } from "../types";
import * as multiparty from "multiparty";
import * as guid from "uuid";
import * as mime from "mime-types";

/**
 * Class that handles file upload operations
 */
class CreateAssetHandler
{
    /**
     * Handle a create asset (file upload) request
     * @param ctx Request context
     * @param req Request object
     */
    async executeAsync(ctx: Context, req: any): Promise<void>
    {
        if (!ctx.config.storage)
            execService.throwError("e668", 500, "file upload is not supported for this site");
        if (!ctx.user.id)
            execService.throwError("4f53", 401, "anonymous upload is not supported");
        await helperService.onBeginWriteRequestAsync(ctx, "create", null, { "ownerid": ctx.user.id });
        const { error, name } = await this.uploadFileAsync(ctx, req);
        if (error)
        {
            execService.sendErrorResponse(ctx, "d2d0", 500, "error while uploading file to storage system");
        }
        else
        {
            const insertedId = await ctx.db.insertAsync(ctx, "asset", ["ownerid", "filename"], [ctx.user.id, name]);
            ctx.res.json({ assetId: insertedId.toString(), fileName: name });
        }
    }

    /**
     * Upload a file to Azure Blob Storage
     * @param ctx Request context
     * @param req Request object
     * @returns upload response
     */
    private uploadFileAsync(ctx: Context, req: any): Promise<IUploadFileResponse>
    {
        return new Promise(resolve =>
        {
            let isFirstPartReceived = false;
            const form = new (multiparty.Form)();
            form.on('part', (stream: any) =>
            {
                execService.catchAllErrorsAsync(ctx, async () =>
                {
                    isFirstPartReceived = true;
                    if (!stream.filename)
                        execService.throwError("ffce", 400, "submitted file is not a valid file");
                    const size = stream.byteCount - stream.byteOffset;
                    const name = guid() + stream.filename.substring(stream.filename.lastIndexOf("."));
                    const error = await this.uploadViaAdapterAsync(ctx, name, stream, size);
                    resolve({ error: error, name: name });
                });
            });
            form.on('progress', (bytesReceived, bytesExpected) =>
            {
                execService.catchAllErrorsAsync(ctx, () =>
                {
                    if (!isFirstPartReceived && bytesReceived >= bytesExpected)
                        execService.sendErrorResponse(ctx, "171d", 400, "error while parsing the first part");
                });
            });
            form.on('error', (err) =>
            {
                execService.catchAllErrorsAsync(ctx, () =>
                {
                    execService.sendErrorResponse(ctx, "ead9", 400, "error while parsing form data");
                });
            });
            form.parse(req);
        });
    }

    /**
     * Execute an upload via storage adapter
     * @param ctx Context object
     * @param name File name
     * @param stream File stream
     * @param size File size
     * @returns error if any
     */
    private uploadViaAdapterAsync(ctx: Context, name: string, stream: any, size: number): Promise<any>
    {
        const provider = ctx.config.storage.provider;
        if (provider === "azure")
        {
            return ctx.storage.azureUploadAsync(ctx.config.storage.azureStorageContainerName, name, stream, size,
                {
                    contentSettings: { contentType: mime.lookup(name) }
                });
        }
        else if (provider === "s3")
        {
            return ctx.storage.s3UploadAsync(
                {
                    Bucket: ctx.config.storage.s3Bucket,
                    Key: name,
                    ACL: 'public-read',
                    Body: stream,
                    ContentLength: stream.byteCount,
                    ContentType: mime.lookup(name)
                });
        }
        else if (provider === "local")
        {
            return ctx.storage.localUploadAsync(name, stream, ctx.config.storage.uploadPath);
        }
        else if (provider === "custom")
        {
            return ctx.storage.customUploadAsync(name, stream, size);
        }
        else
        {
            throw `Unknown provider: ${provider}`;
        }
    }
};

const createAssetHandler = new CreateAssetHandler();
export { createAssetHandler };