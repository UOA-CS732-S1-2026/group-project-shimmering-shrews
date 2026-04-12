"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const testRoute_1 = __importDefault(require("./routes/testRoute"));
const challengeRoute_1 = __importDefault(require("./routes/challengeRoute"));
const errorMiddleWare_1 = require("./middleware/errorMiddleWare");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(errorMiddleWare_1.errorHandler);
app.get('/', (_req, res) => {
    res.send('API is running for Shimmering Shrews pretty app!');
});
app.use('/', testRoute_1.default);
app.use('/challenges', challengeRoute_1.default);
exports.default = app;
