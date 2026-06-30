/**
 * Copies a Flutter release APK into public/downloads when building from the monorepo.
 * Standalone Vercel deploys skip quietly — APK is committed under public/downloads/.
 */
import { cpSync, existsSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "..");
const publicDir = path.join(webRoot, "public", "downloads");
const dest = path.join(publicDir, "coffeeshop.apk");

const candidates = [
  path.join(repoRoot, "build", "app", "outputs", "flutter-apk", "app-release.apk"),
  path.join(repoRoot, "build", "app", "outputs", "apk", "release", "app-release.apk"),
];

const source = candidates.find((p) => existsSync(p));

if (!source) {
  if (existsSync(dest)) {
    const mb = (statSync(dest).size / (1024 * 1024)).toFixed(1);
    console.log(`[copy-apk] Using committed APK at public/downloads/coffeeshop.apk (${mb} MB)`);
  } else {
    console.warn("[copy-apk] No Flutter APK found and no committed public/downloads/coffeeshop.apk.");
  }
  process.exit(0);
}

mkdirSync(publicDir, { recursive: true });
cpSync(source, dest);
const mb = (statSync(dest).size / (1024 * 1024)).toFixed(1);
console.log(`[copy-apk] ${path.relative(webRoot, source)} → public/downloads/coffeeshop.apk (${mb} MB)`);
