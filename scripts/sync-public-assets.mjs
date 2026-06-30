/**
 * Copies shared repo images into react-web/public for Vercel (no parent-dir symlinks).
 * Safe to run locally before dev/build; skips missing sources with a warning.
 */
import { cpSync, existsSync, lstatSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "..");
const publicDir = path.join(webRoot, "public");

/** Remove file or symlink at `target` so copies land as real files. */
function clearTarget(target) {
  if (!existsSync(target)) return;
  const stat = lstatSync(target);
  rmSync(target, { recursive: true, force: true, ...(stat.isDirectory() && !stat.isSymbolicLink() ? {} : {}) });
}

function copyFile(from, to) {
  if (!existsSync(from)) {
    console.warn(`[sync-public-assets] skip (missing): ${path.relative(repoRoot, from)}`);
    return false;
  }
  clearTarget(to);
  mkdirSync(path.dirname(to), { recursive: true });
  cpSync(from, to);
  console.log(`[sync-public-assets] ${path.relative(repoRoot, from)} → public/${path.relative(publicDir, to)}`);
  return true;
}

const copies = [
  { from: path.join(repoRoot, "image", "logo123.jpeg"), to: path.join(publicDir, "logo123.jpeg") },
  { from: path.join(repoRoot, "images", "4.webp"), to: path.join(publicDir, "images", "4.webp") },
  { from: path.join(repoRoot, "images1", "1.jpeg"), to: path.join(publicDir, "images1", "1.jpeg") },
  { from: path.join(repoRoot, "images1", "2.jpeg"), to: path.join(publicDir, "images1", "2.jpeg") },
];

// If promo 1.jpeg is missing (repo drift), reuse 2.jpeg so carousel still works.
const promo1 = path.join(repoRoot, "images1", "1.jpeg");
const promo2 = path.join(repoRoot, "images1", "2.jpeg");
if (!existsSync(promo1) && existsSync(promo2)) {
  console.warn("[sync-public-assets] images1/1.jpeg missing — using 2.jpeg as fallback for promo1");
  copies[2] = { from: promo2, to: path.join(publicDir, "images1", "1.jpeg") };
}

// Replace symlinked public/images1 with a real folder.
const images1Public = path.join(publicDir, "images1");
if (existsSync(images1Public) && lstatSync(images1Public).isSymbolicLink()) {
  rmSync(images1Public, { recursive: true, force: true });
}

let copied = 0;
for (const { from, to } of copies) {
  if (copyFile(from, to)) copied += 1;
}

if (copied === 0) {
  console.warn("[sync-public-assets] no files copied — ensure react-web/public assets exist for deploy.");
} else {
  console.log(`[sync-public-assets] done (${copied} file(s)).`);
}
