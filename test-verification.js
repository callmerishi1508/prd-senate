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
var research_engine_1 = require("./src/lib/research/research-engine");
var quality_gate_1 = require("./src/lib/quality/quality-gate");
var renderer_1 = require("./src/lib/prd/renderer");
function testEngine() {
    return __awaiter(this, void 0, void 0, function () {
        var t1, t2, t3, t4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("=== Running Research Engine Tests ===");
                    return [4 /*yield*/, (0, research_engine_1.runResearchEngine)("Build a banking app")];
                case 1:
                    t1 = _a.sent();
                    console.log("Test 1 (Banking):", t1.productCategory, "- Confidence:", t1.researchConfidence);
                    console.log("  Standards:", t1.marketStandards.map(function (s) { return s.category; }).join(", "));
                    console.log("  Features:", t1.commonFeatures.join(", "));
                    return [4 /*yield*/, (0, research_engine_1.runResearchEngine)("Build a ride sharing app")];
                case 2:
                    t2 = _a.sent();
                    console.log("Test 2 (Ride Sharing):", t2.productCategory, "- Confidence:", t2.researchConfidence);
                    console.log("  Standards:", t2.marketStandards.map(function (s) { return s.category; }).join(", "));
                    console.log("  Features:", t2.commonFeatures.join(", "));
                    return [4 /*yield*/, (0, research_engine_1.runResearchEngine)("Build a note taking app")];
                case 3:
                    t3 = _a.sent();
                    console.log("Test 3 (Note Taking):", t3.productCategory, "- Confidence:", t3.researchConfidence);
                    console.log("  Standards:", t3.marketStandards.map(function (s) { return s.category; }).join(", "));
                    console.log("  Features:", t3.commonFeatures.join(", "));
                    return [4 /*yield*/, (0, research_engine_1.runResearchEngine)("Build an AI legal marketplace")];
                case 4:
                    t4 = _a.sent();
                    console.log("Test 4 (Legal Marketplace - Fallback):", t4.productCategory, "- Confidence:", t4.researchConfidence);
                    return [2 /*return*/];
            }
        });
    });
}
function testQualityGate() {
    return __awaiter(this, void 0, void 0, function () {
        var mockPRD, md, rideSharingReport, report;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log("\n=== Running Quality Gate Completeness Test ===");
                    mockPRD = {
                        productOverview: "A ride sharing application for users.",
                        goals: [{ description: "Match riders and drivers" }],
                        nonGoals: [{ description: "Food delivery" }],
                        userPersonas: [
                            { name: "Rider", age: "25", gender: "Any", healthStatus: "Good", preferences: "Fast rides" }
                        ],
                        functionalRequirements: [
                            { id: "FR-01", description: "Users can pay for rides", purpose: "Payments", userValue: "Convenience", source: "Market Standard" },
                            { id: "FR-02", description: "Users can rate drivers", purpose: "Ratings", userValue: "Trust", source: "Market Standard" }
                            // INTENTIONALLY OMITTING GPS / LOCATION TRACKING
                        ],
                        userExperience: "Clean and simple.",
                        narrative: "User opens app, gets ride.",
                        successMetrics: [{ id: "SM-01", description: "Rides completed" }],
                        technicalConsiderations: ["Data storage", "Security", "Privacy", "Performance", "Scalability"],
                        milestones: ["MVP", "V2"],
                        userStories: [
                            { id: "US-01", title: "Pay for ride", description: "As a rider I want to pay.", acceptanceCriteria: ["Payment successful"] }
                        ]
                    };
                    md = (0, renderer_1.renderPRDToMarkdown)(mockPRD);
                    console.log("Invoking Quality Gate (expecting it to notice missing GPS/Location standard for a ride sharing app)...");
                    return [4 /*yield*/, (0, research_engine_1.runResearchEngine)("Build a ride sharing app")];
                case 1:
                    rideSharingReport = _d.sent();
                    return [4 /*yield*/, (0, quality_gate_1.runQualityGate)(md, rideSharingReport, 'qwen2.5:1.5b')];
                case 2:
                    report = _d.sent();
                    console.log("Quality Gate Decision:", report.decision);
                    if ((_a = report.criticalIssues) === null || _a === void 0 ? void 0 : _a.length)
                        console.log("Critical Issues:", report.criticalIssues);
                    if ((_b = report.majorIssues) === null || _b === void 0 ? void 0 : _b.length)
                        console.log("Major Issues:", report.majorIssues);
                    if ((_c = report.minorIssues) === null || _c === void 0 ? void 0 : _c.length)
                        console.log("Minor Issues:", report.minorIssues);
                    return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, testEngine()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, testQualityGate()];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(console.error);
