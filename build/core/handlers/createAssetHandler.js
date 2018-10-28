"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const execService_1 = require("../services/execService");
const helperService_1 = require("../services/helperService");
const dataService_1 = require("../services/dataService");
/**
 * Class that handles file upload operations
 */
class CreateAssetHandler {
    /**
     * Handle a create asset (file upload) request
     * @param ctx Request context
     * @param req Request object
     */
    execute(ctx, req) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!ctx.config.storage)
                execService_1.execService.throwError("e668", 500, "file upload is not supported for this site");
            if (!ctx.user.id)
                execService_1.execService.throwError("4f53", 401, "anonymous upload is not supported");
            yield helperService_1.helperService.onBeginWriteRequest(ctx, "create", dataService_1.dataService.db, null, { "ownerid": ctx.user.id });
            const { error, name } = yield dataService_1.dataService.storage.uploadFile(ctx, req);
            if (error) {
                execService_1.execService.sendErrorResponse(ctx, "d2d0", 500, "error while uploading file to storage system");
            }
            else {
                const insertedId = yield dataService_1.dataService.db.insert(ctx, "asset", ["ownerid", "filename"], [ctx.user.id, name]);
                ctx.res.send(insertedId.toString());
            }
        });
    }
}
;
const createAssetHandler = new CreateAssetHandler();
exports.createAssetHandler = createAssetHandler;
