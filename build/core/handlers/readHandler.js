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
const conditionFactory_1 = require("../services/conditionFactory");
const dataService_1 = require("../services/dataService");
/**
 * Class that handles read operations
 */
class ReadHandler {
    /**
     * Handle a read request
     * @param ctx Request context
     * @param requestParams Request parameters
     * @param isFullMode Whether to do the read in full mode (full mode = include rich text fields in response)
     */
    execute(ctx, requestParams, isFullMode) {
        return __awaiter(this, void 0, void 0, function* () {
            // set owner role if the read operation is run in private mode
            if (requestParams.accessType === "private") {
                // private read mode. add owner role directly, add ownerid condition later
                if (!ctx.user.id)
                    execService_1.execService.throwError("a058", 401, "Unauthorized");
                ctx.user.roles.push("owner");
            }
            // verify that current user context is allowed to execute a read
            helperService_1.helperService.validateRoles(ctx, "read");
            // get pagination and ordering info
            const skip = isNaN(parseInt(requestParams.skip)) ? 0 : parseInt(requestParams.skip);
            const take = isNaN(parseInt(requestParams.take)) ? 10 : parseInt(requestParams.take);
            const orderByField = !requestParams.orderByField ? "id" : requestParams.orderByField;
            // get condition
            const configConditionStr = this.getConditionStringFromConfig(ctx);
            const condition = this.getConditionFromRequest(ctx, requestParams);
            if (configConditionStr !== "") {
                condition.children.push(conditionFactory_1.conditionFactory.parse(ctx, configConditionStr));
            }
            // execute
            const fields = helperService_1.helperService.getFields(ctx, "read");
            const count = yield dataService_1.dataService.db.count(ctx, fields, ctx.entity, condition, true);
            const dbResponse = yield dataService_1.dataService.db.select(ctx, fields, ctx.entity, condition, orderByField, skip, take, true, isFullMode);
            for (let i = 0; i < dbResponse.length; i++) {
                dbResponse[i] = helperService_1.helperService.fixDataKeysAndTypes(ctx, dbResponse[i]);
            }
            ctx.res.json({ "count": count, "items": dbResponse });
        });
    }
    /**
     * Get condition string from config
     * @param ctx Request context
     * @returns condition string
     */
    getConditionStringFromConfig(ctx) {
        const entityConfig = ctx.config.entities[ctx.entity];
        if (!entityConfig.getReadCondition)
            return "";
        return entityConfig.getReadCondition(ctx.user.roles, ctx.user.id);
    }
    /**
     * Get Condition object from the request
     * @param ctx Request context
     * @param requestParams Request parameters
     * @param conditionFactory Condition factory
     * @param exec Exec module
     * @returns Condition object
     */
    getConditionFromRequest(ctx, requestParams) {
        const isPrivate = requestParams.accessType === "private";
        const condition = conditionFactory_1.conditionFactory.createCompound("&", []);
        if (requestParams.condition) {
            const conditionString = decodeURIComponent(requestParams.condition);
            condition.children.push(conditionFactory_1.conditionFactory.parse(ctx, conditionString));
        }
        else if (requestParams.id) {
            condition.children.push(conditionFactory_1.conditionFactory.createSingle(ctx.entity, "id", "=", requestParams.id));
        }
        if (isPrivate) {
            const fieldName = ctx.entity === "user" ? "id" : "ownerid";
            const userIdInCondition = condition.findConditionValue(fieldName);
            if (userIdInCondition !== ctx.user.id) {
                execService_1.execService.throwError("a19c", 401, "Unauthorized");
            }
            condition.children.push(conditionFactory_1.conditionFactory.createSingle(ctx.entity, fieldName, "=", ctx.user.id));
        }
        return condition;
    }
}
const readHandler = new ReadHandler();
exports.readHandler = readHandler;
