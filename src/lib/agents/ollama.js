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
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamOllamaChat = streamOllamaChat;
exports.generateOllamaResponse = generateOllamaResponse;
var DEFAULT_MODEL = 'qwen2.5:1.5b';
var http_1 = require("http");
function streamOllamaChat(messages_1) {
    return __asyncGenerator(this, arguments, function streamOllamaChat_1(messages, options) {
        var model, postData, reqOptions, response, decoder, _a, response_1, response_1_1, chunk, text, lines, _i, lines_1, line, json, e_1, e_2_1;
        var _b, e_2, _c, _d;
        var _e, _f;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    model = options.model || DEFAULT_MODEL;
                    postData = JSON.stringify({
                        model: model,
                        messages: messages,
                        stream: true,
                        options: {
                            temperature: (_e = options.temperature) !== null && _e !== void 0 ? _e : 0.7,
                            num_ctx: options.num_ctx,
                            num_predict: options.num_predict
                        },
                        format: options.format
                    });
                    reqOptions = {
                        hostname: 'localhost',
                        port: 11434,
                        path: '/api/chat',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Content-Length': Buffer.byteLength(postData)
                        },
                        timeout: 0 // Explicitly disable timeout to prevent Headers Timeout Error
                    };
                    return [4 /*yield*/, __await(new Promise(function (resolve, reject) {
                            var req = http_1.default.request(reqOptions, function (res) {
                                resolve(res);
                            });
                            req.on('error', reject);
                            req.on('timeout', function () {
                                req.destroy();
                                reject(new Error('http request timeout'));
                            });
                            // Some versions of Node require explicitly disabling the socket timeout
                            req.on('socket', function (socket) {
                                socket.setTimeout(0);
                            });
                            req.write(postData);
                            req.end();
                        }))];
                case 1:
                    response = _g.sent();
                    if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                        throw new Error("Ollama API error: ".concat(response.statusCode));
                    }
                    decoder = new TextDecoder();
                    _g.label = 2;
                case 2:
                    _g.trys.push([2, 14, 15, 20]);
                    _a = true, response_1 = __asyncValues(response);
                    _g.label = 3;
                case 3: return [4 /*yield*/, __await(response_1.next())];
                case 4:
                    if (!(response_1_1 = _g.sent(), _b = response_1_1.done, !_b)) return [3 /*break*/, 13];
                    _d = response_1_1.value;
                    _a = false;
                    chunk = _d;
                    text = decoder.decode(chunk, { stream: true });
                    lines = text.split('\n').filter(Boolean);
                    _i = 0, lines_1 = lines;
                    _g.label = 5;
                case 5:
                    if (!(_i < lines_1.length)) return [3 /*break*/, 12];
                    line = lines_1[_i];
                    _g.label = 6;
                case 6:
                    _g.trys.push([6, 10, , 11]);
                    json = JSON.parse(line);
                    if (!((_f = json.message) === null || _f === void 0 ? void 0 : _f.content)) return [3 /*break*/, 9];
                    return [4 /*yield*/, __await(json.message.content)];
                case 7: return [4 /*yield*/, _g.sent()];
                case 8:
                    _g.sent();
                    _g.label = 9;
                case 9: return [3 /*break*/, 11];
                case 10:
                    e_1 = _g.sent();
                    console.error("Error parsing Ollama chunk", e_1);
                    return [3 /*break*/, 11];
                case 11:
                    _i++;
                    return [3 /*break*/, 5];
                case 12:
                    _a = true;
                    return [3 /*break*/, 3];
                case 13: return [3 /*break*/, 20];
                case 14:
                    e_2_1 = _g.sent();
                    e_2 = { error: e_2_1 };
                    return [3 /*break*/, 20];
                case 15:
                    _g.trys.push([15, , 18, 19]);
                    if (!(!_a && !_b && (_c = response_1.return))) return [3 /*break*/, 17];
                    return [4 /*yield*/, __await(_c.call(response_1))];
                case 16:
                    _g.sent();
                    _g.label = 17;
                case 17: return [3 /*break*/, 19];
                case 18:
                    if (e_2) throw e_2.error;
                    return [7 /*endfinally*/];
                case 19: return [7 /*endfinally*/];
                case 20: return [2 /*return*/];
            }
        });
    });
}
function generateOllamaResponse(messages_1) {
    return __awaiter(this, arguments, void 0, function (messages, options) {
        var fullContent, _a, _b, _c, chunk, e_3_1, error_1, cause;
        var _d, e_3, _e, _f;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    fullContent = '';
                    _g.label = 1;
                case 1:
                    _g.trys.push([1, 14, , 15]);
                    _g.label = 2;
                case 2:
                    _g.trys.push([2, 7, 8, 13]);
                    _a = true, _b = __asyncValues(streamOllamaChat(messages, options));
                    _g.label = 3;
                case 3: return [4 /*yield*/, _b.next()];
                case 4:
                    if (!(_c = _g.sent(), _d = _c.done, !_d)) return [3 /*break*/, 6];
                    _f = _c.value;
                    _a = false;
                    chunk = _f;
                    fullContent += chunk;
                    _g.label = 5;
                case 5:
                    _a = true;
                    return [3 /*break*/, 3];
                case 6: return [3 /*break*/, 13];
                case 7:
                    e_3_1 = _g.sent();
                    e_3 = { error: e_3_1 };
                    return [3 /*break*/, 13];
                case 8:
                    _g.trys.push([8, , 11, 12]);
                    if (!(!_a && !_d && (_e = _b.return))) return [3 /*break*/, 10];
                    return [4 /*yield*/, _e.call(_b)];
                case 9:
                    _g.sent();
                    _g.label = 10;
                case 10: return [3 /*break*/, 12];
                case 11:
                    if (e_3) throw e_3.error;
                    return [7 /*endfinally*/];
                case 12: return [7 /*endfinally*/];
                case 13: return [2 /*return*/, fullContent];
                case 14:
                    error_1 = _g.sent();
                    if (error_1 instanceof Error && error_1.cause) {
                        cause = error_1.cause;
                        if (typeof cause === 'string') {
                            throw new Error("Ollama fetch failed: ".concat(cause));
                        }
                        else {
                            throw new Error("Ollama fetch failed: ".concat(cause.message || cause.code || String(cause)));
                        }
                    }
                    throw error_1;
                case 15: return [2 /*return*/];
            }
        });
    });
}
