"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const challengeController_1 = require("../controllers/challengeController");
const router = (0, express_1.Router)();
router.get('/', challengeController_1.getChallenges);
exports.default = router;
