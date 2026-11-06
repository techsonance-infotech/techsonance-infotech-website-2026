const Module = require("module");
const path = require("path");
const fs = require("fs");

const projectRoot = path.resolve(__dirname, "..");
const emptyMockPath = path.resolve(projectRoot, "tests/mocks/empty.ts");

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === "server-only") {
    return emptyMockPath;
  }
  if (request.startsWith("@/")) {
    const subPath = request.slice(2);
    const resolvedPath = path.resolve(projectRoot, subPath);
    const candidates = [
      resolvedPath,
      resolvedPath + ".ts",
      resolvedPath + ".tsx",
      resolvedPath + ".js",
      path.join(resolvedPath, "index.ts"),
      path.join(resolvedPath, "index.tsx"),
      path.join(resolvedPath, "route.ts"),
    ];
    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        return cand;
      }
    }
    return resolvedPath;
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

process.env.NODE_ENV = process.env.NODE_ENV || "test";
