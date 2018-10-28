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
const conditionFactory_1 = require("../services/conditionFactory");
/**
 * Class that handles update operations
 */
class UpdateHandler {
    /**
     * Handle an update request
     * @param ctx Request context
     * @param requestBody Request body
     * @param recordId Record ID to update
     */
    execute(ctx, requestBody, recordId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { record } = yield helperService_1.helperService.onBeginWriteRequest(ctx, "update", dataService_1.dataService.db, recordId, requestBody);
            const updateData = {};
            const fields = helperService_1.helperService.getFields(ctx, "update");
            for (let i = 0; i < fields.length; i++) {
                const fieldName = fields[i];
                if (!requestBody.hasOwnProperty(fieldName))
                    continue;
                updateData[fieldName] = requestBody[fieldName];
            }
            if (Object.keys(updateData).length === 0) {
                execService_1.execService.throwError("582e", 400, "bad request");
            }
            if (ctx.entity === "user" && record.domain !== "local") {
                execService_1.execService.throwError("511f", 400, "updating external user info is not supported");
            }
            const condition = conditionFactory_1.conditionFactory.createSingle(ctx.entity, "id", "=", recordId);
            const dbResponse = yield dataService_1.dataService.db.update(ctx, ctx.entity, updateData, condition);
            ctx.res.send(dbResponse);
        });
    }
}
const updateHandler = new UpdateHandler();
exports.updateHandler = updateHandler;
