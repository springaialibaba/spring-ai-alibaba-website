"use strict";
// Import the `esbuild` package installed by `vite`
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const Module = require("module");
function requireFrom(self, contextModuleName, wantedModuleName) {
    const contextModulePath = Module._resolveFilename(contextModuleName, self);
    const virtualModule = new Module(contextModulePath, module);
    virtualModule.filename = contextModulePath;
    virtualModule.paths = Module._nodeModulePaths(path_1.default.dirname(contextModulePath));
    return virtualModule.require(wantedModuleName);
}
exports.default = requireFrom(module, "vite", "esbuild");
