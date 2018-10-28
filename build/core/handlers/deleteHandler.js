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
const helperService_1 = require("../services/helperService");
const execService_1 = require("../services/execService");
const dataService_1 = require("../services/dataService");
/**
 * Class that handles delete operations
 */
class DeleteHandler {
    /**
     * Handle a delete record request
     * @param ctx Request context
     * @param recordId Record ID to delete
     */
    execute(ctx, recordId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { record } = yield helperService_1.helperService.onBeginWriteRequest(ctx, "delete", dataService_1.dataService.db, recordId, null);
            if (ctx.entity === "user" && record.domain !== "local")
                execService_1.execService.throwError("d789", 400, "updating external user info is not supported");
            const dbResponse = yield dataService_1.dataService.db.deleteRecord(ctx, ctx.entity, recordId);
            ctx.res.send(dbResponse);
        });
    }
}
;
const deleteHandler = new DeleteHandler();
exports.deleteHandler = deleteHandler;
