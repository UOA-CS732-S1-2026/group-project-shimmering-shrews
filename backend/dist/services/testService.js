"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDatabase = void 0;
const database_1 = __importDefault(require("../config/database"));
const testDatabase = async () => {
    const result = await database_1.default.query('SELECT NOW() AS current_time');
    return result.rows[0];
};
exports.testDatabase = testDatabase;
