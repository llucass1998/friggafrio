import { existsSync, readFileSync, statSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export class MedusaRuntimeContractError extends Error {
  constructor(code, detail = "") {
    super(detail ? `${code}: ${detail}` : code);
    this.code = code;
  }
}

export function getMedusaRuntimePaths(releaseDir) {
  const releaseRoot = resolve(releaseDir);
  const runtimeDir = resolve(releaseRoot, "apps/backend/.medusa/server");
  return {
    releaseRoot,
    runtimeDir,
    runtimePackage: resolve(runtimeDir, "package.json"),
    adminDir: resolve(runtimeDir, "public/admin"),
    adminIndex: resolve(runtimeDir, "public/admin/index.html"),
  };
}

function isWithin(directory, candidate) {
  const path = relative(directory, candidate);
  return path && !path.startsWith(`..${sep}`) && path !== ".." && !isAbsolute(path);
}

function requiredFile(path, code) {
  if (!existsSync(path) || !statSync(path).isFile() || statSync(path).size === 0) {
    throw new MedusaRuntimeContractError(code, path);
  }
}

export function adminAssetsFromHtml(html) {
  const assets = new Set();
  const references = html.matchAll(/\b(?:src|href)=(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi);

  for (const reference of references) {
    const value = (reference[1] || reference[2] || reference[3] || "").trim();
    if (!value || /^(?:https?:|data:|javascript:|#|\/\/)/i.test(value)) continue;

    const pathname = value.split(/[?#]/, 1)[0];
    if (!/\.(?:[cm]?js|css)$/i.test(pathname)) continue;
    assets.add(pathname.replace(/^\/app\//, "").replace(/^\//, ""));
  }

  return [...assets].sort();
}

function assertRuntimeDependencies(runtimeDir) {
  const candidates = [
    resolve(runtimeDir, "node_modules/.bin/medusa"),
    resolve(runtimeDir, "node_modules/.bin/medusa.cmd"),
  ];
  if (!candidates.some((candidate) => existsSync(candidate))) {
    throw new MedusaRuntimeContractError(
      "MEDUSA_RUNTIME_DEPENDENCIES_MISSING",
      runtimeDir,
    );
  }
}

export function validateMedusaRuntimeContract({
  releaseDir,
  runtimeDir = getMedusaRuntimePaths(releaseDir).runtimeDir,
  requireRuntimeDependencies = false,
}) {
  const paths = getMedusaRuntimePaths(releaseDir);
  if (resolve(runtimeDir) !== paths.runtimeDir) {
    throw new MedusaRuntimeContractError(
      "MEDUSA_RUNTIME_WORKING_DIRECTORY_INVALID",
      resolve(runtimeDir),
    );
  }

  requiredFile(paths.runtimePackage, "MEDUSA_RUNTIME_PACKAGE_MISSING");
  try {
    JSON.parse(readFileSync(paths.runtimePackage, "utf8"));
  } catch {
    throw new MedusaRuntimeContractError(
      "MEDUSA_RUNTIME_PACKAGE_INVALID",
      paths.runtimePackage,
    );
  }

  if (!existsSync(paths.adminIndex) || !statSync(paths.adminIndex).isFile()) {
    throw new MedusaRuntimeContractError("MEDUSA_ADMIN_INDEX_MISSING", paths.adminIndex);
  }
  const adminHtml = readFileSync(paths.adminIndex, "utf8");
  if (!adminHtml.trim()) {
    throw new MedusaRuntimeContractError("MEDUSA_ADMIN_INDEX_EMPTY", paths.adminIndex);
  }

  const adminAssets = adminAssetsFromHtml(adminHtml);
  if (!adminAssets.length) {
    throw new MedusaRuntimeContractError("MEDUSA_ADMIN_ASSETS_MISSING", paths.adminIndex);
  }
  for (const asset of adminAssets) {
    const assetPath = resolve(paths.adminDir, asset);
    if (!isWithin(paths.adminDir, assetPath)) {
      throw new MedusaRuntimeContractError("MEDUSA_ADMIN_ASSET_PATH_INVALID", asset);
    }
    requiredFile(assetPath, "MEDUSA_ADMIN_ASSET_MISSING");
  }

  if (requireRuntimeDependencies) assertRuntimeDependencies(paths.runtimeDir);

  return { ...paths, adminAssets };
}

function parseArguments(argv) {
  const options = { requireRuntimeDependencies: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--release-dir") options.releaseDir = argv[++index];
    else if (argument === "--runtime-dir") options.runtimeDir = argv[++index];
    else if (argument === "--require-runtime-dependencies") options.requireRuntimeDependencies = true;
    else throw new MedusaRuntimeContractError("MEDUSA_RUNTIME_ARGUMENT_INVALID", argument);
  }
  if (!options.releaseDir) {
    throw new MedusaRuntimeContractError("MEDUSA_RUNTIME_RELEASE_DIR_REQUIRED");
  }
  return options;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  try {
    const result = validateMedusaRuntimeContract(parseArguments(process.argv.slice(2)));
    console.log(`MEDUSA_RUNTIME_DIR=${result.runtimeDir}`);
    console.log(`MEDUSA_RUNTIME_PACKAGE=PASS`);
    console.log(`MEDUSA_ADMIN_INDEX=PASS`);
    console.log(`MEDUSA_ADMIN_ASSETS=${result.adminAssets.length}`);
    console.log("MEDUSA_RUNTIME_CONTRACT=PASS");
  } catch (error) {
    console.error(error.code || error.message);
    process.exitCode = 1;
  }
}
