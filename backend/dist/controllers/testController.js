"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestDb = void 0;
const testService_1 = require("../services/testService");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.getTestDb = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const data = await (0, testService_1.testDatabase)();
    res.status(200).json({
        success: true,
        message: 'Test DB successful - current time retrieved',
        data,
    });
});
