"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const ApiError_1 = require("../utils/ApiError");
const errorHandler = (err, _req, res, _next) => {
    const statusCode = err instanceof ApiError_1.ApiError ? err.statusCode : 500;
    const message = err instanceof ApiError_1.ApiError ? err.message : 'Internal Server Error';
    res.status(statusCode).json({
        success: false,
        message,
    });
};
exports.errorHandler = errorHandler;
