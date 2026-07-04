"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runResearchEngine = runResearchEngine;
var ride_sharing_1 = require("./templates/ride-sharing");
var banking_1 = require("./templates/banking");
var note_taking_1 = require("./templates/note-taking");
var fitness_1 = require("./templates/fitness");
var ecommerce_1 = require("./templates/ecommerce");
var social_media_1 = require("./templates/social-media");
var edtech_1 = require("./templates/edtech");
var healthcare_1 = require("./templates/healthcare");
var saas_1 = require("./templates/saas");
var generic_1 = require("./templates/generic");
var templates = [
    ride_sharing_1.rideSharingTemplate,
    banking_1.bankingTemplate,
    note_taking_1.noteTakingTemplate,
    fitness_1.fitnessTemplate,
    ecommerce_1.ecommerceTemplate,
    social_media_1.socialMediaTemplate,
    edtech_1.edtechTemplate,
    healthcare_1.healthcareTemplate,
    saas_1.saasTemplate
];
function runResearchEngine(userInput) {
    return __awaiter(this, void 0, void 0, function () {
        var normalizedInput, bestMatch, maxMatchCount, _i, templates_1, template, matchCount, _a, _b, keyword, confidence;
        return __generator(this, function (_c) {
            normalizedInput = userInput.toLowerCase();
            bestMatch = generic_1.genericTemplate;
            maxMatchCount = 0;
            for (_i = 0, templates_1 = templates; _i < templates_1.length; _i++) {
                template = templates_1[_i];
                matchCount = 0;
                for (_a = 0, _b = template.keywords; _a < _b.length; _a++) {
                    keyword = _b[_a];
                    if (normalizedInput.includes(keyword.toLowerCase())) {
                        matchCount++;
                    }
                }
                if (matchCount > maxMatchCount) {
                    maxMatchCount = matchCount;
                    bestMatch = template;
                }
            }
            confidence = 50;
            if (bestMatch !== generic_1.genericTemplate) {
                confidence = Math.min(100, 70 + (maxMatchCount * 10));
            }
            return [2 /*return*/, {
                    productCategory: bestMatch.category,
                    researchConfidence: confidence,
                    researchSources: [
                        "Market Standards Template",
                        "Competitor Analysis Database",
                        "Industry Best Practices Guidelines"
                    ],
                    competitors: bestMatch.competitors,
                    commonFeatures: bestMatch.commonFeatures,
                    marketStandards: bestMatch.marketStandards,
                    opportunities: bestMatch.opportunities,
                    risks: bestMatch.risks
                }];
        });
    });
}
