"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChallenges = void 0;
const challengeService_1 = require("../services/challengeService");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.getChallenges = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const challenges = await (0, challengeService_1.getAllChallenges)();
    res.status(200).json({
        success: true,
        data: challenges,
    });
});
