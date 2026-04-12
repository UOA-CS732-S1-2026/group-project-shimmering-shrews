"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAllActiveChallenges = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const findAllActiveChallenges = async () => {
    return prisma_1.default.challenge.findMany({
        where: {
            is_active: true,
        },
        select: {
            id: true,
            name: true,
            description: true,
            xp_worth: true,
            challenge_category: {
                select: {
                    id: true,
                    name: true,
                    icon: true,
                },
            },
            location: {
                select: {
                    id: true,
                    name: true,
                    latitude: true,
                    longitude: true,
                },
            },
        },
    });
};
exports.findAllActiveChallenges = findAllActiveChallenges;
