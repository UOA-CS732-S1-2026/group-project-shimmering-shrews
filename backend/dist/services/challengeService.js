"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllChallenges = void 0;
const challengeDao_1 = require("../daos/challengeDao");
const getAllChallenges = async () => {
    return (0, challengeDao_1.findAllActiveChallenges)();
};
exports.getAllChallenges = getAllChallenges;
