"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRegisterPath = exports.sortPath = void 0;
function sortPath(a, b) {
    return a.handlePath.localeCompare(b.handlePath);
}
exports.sortPath = sortPath;
function getRegisterPath(options) {
    const { filePath, routePath } = options;
    let [name = ""] = routePath.split(".");
    const handlePath = name.replace("index", "").replace(/\[([a-z]+)\]/gi, ":$1");
    return {
        handlePath: handlePath === "/" ? handlePath : handlePath.replace(/\/$/, ""),
        filePath,
    };
}
exports.getRegisterPath = getRegisterPath;
