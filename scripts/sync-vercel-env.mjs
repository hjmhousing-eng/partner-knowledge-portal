import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const i = trimmed.indexOf("=");
    if (i < 1) {
      continue;
    }
    const key = trimmed.slice(0, i).trim();
    let value = trimmed.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value) {
      out[key] = value;
    }
  }
  return out;
}

const env = existsSync(".env") ? parseEnv(readFileSync(".env", "utf8")) : {};
if (existsSync("demo-reviewers.json")) {
  env.DEMO_REVIEWERS = readFileSync("demo-reviewers.json", "utf8").trim();
}

const allow = new Set([
  "BOX_CLIENT_ID",
  "BOX_CLIENT_SECRET",
  "BOX_ENTERPRISE_ID",
  "BOX_LIBRARY_FOLDER_ID",
  "BOX_DEMO_PARTNER_USER_ID",
  "BOX_WEBHOOK_SIGNATURE_KEY",
  "DEMO_PARTNER_EMAIL",
  "DEMO_PARTNER_PASSWORD",
  "DEMO_REVIEWERS",
  "REVALIDATE_SECRET",
  "AI_GATEWAY_API_KEY",
  "ASK_MODEL",
]);

let pushed = 0;
for (const [key, value] of Object.entries(env)) {
  if (!allow.has(key)) {
    continue;
  }
  execSync(
    `npx vercel env add ${key} production,preview --force --yes --sensitive`,
    { input: value, stdio: ["pipe", "pipe", "pipe"] },
  );
  pushed += 1;
}

console.log(`Pushed ${pushed} Vercel env vars to production and preview.`);
