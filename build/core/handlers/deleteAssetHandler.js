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
const dataService_1 = require("../services/dataService");
const helperService_1 = require("../services/helperService");
/**
 * Class that handles file deletion operations
 */
class DeleteAssetHandler {
    /**
     * Handle a delete asset (file deletion) request
     * @param ctx Request context
     * @param recordId Record ID of the asset to delete
     */
    execute(ctx, recordId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!ctx.config.storage)
                execService_1.execService.throwError("51be", 500, "file delete is not supported for this site");
            if (!ctx.user.id)
                execService_1.execService.throwError("2c74", 401, "anonymous asset deletion is not supported");
            const { record } = yield helperService_1.helperService.onBeginWriteRequest(ctx, "delete", dataService_1.dataService.db, recordId, null);
            if (!record.filename)
                execService_1.execService.throwError("cd03", 500, "failed to get file name for the requested record");
            const error = yield dataService_1.dataService.storage.deleteFile(ctx, record.filename);
            if (error) {
                execService_1.execService.sendErrorResponse(ctx, "2020", 500, "Asset removal failed: " + error);
            }
            else {
                yield dataService_1.dataService.db.deleteRecord(ctx, "asset", recordId);
                ctx.res.send("Asset removed");
            }
        });
    }
}
;
const deleteAssetHandler = new DeleteAssetHandler();
exports.deleteAssetHandler = deleteAssetHandler;
