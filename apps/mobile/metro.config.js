// metro.config.js — pnpm monorepo setup.
// Watches the workspace root and resolves modules from both the app's own
// node_modules and the root node_modules so symlinked @homegrown/* packages
// (and their transitive deps) bundle correctly at runtime.

const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch the whole monorepo so Metro detects changes in shared packages.
config.watchFolders = [workspaceRoot];

// Resolve modules from both the app root and the monorepo root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = config;
