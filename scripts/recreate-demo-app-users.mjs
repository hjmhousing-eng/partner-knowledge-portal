import { readFileSync, writeFileSync } from "node:fs";
import { BoxCcgAuth, BoxClient, CcgConfig } from "box-typescript-sdk-gen";

function loadEnv() {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 1) continue;
    const key = trimmed.slice(0, i).trim();
    let value = trimmed.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value) process.env[key] = value;
  }
}

loadEnv();

const auth = new BoxCcgAuth({
  config: new CcgConfig({
    clientId: process.env.BOX_CLIENT_ID,
    clientSecret: process.env.BOX_CLIENT_SECRET,
    enterpriseId: process.env.BOX_ENTERPRISE_ID,
  }),
});
const client = new BoxClient({ auth });

const specs = [
  { email: "alex@example.com", password: "review-alex", name: "Alex (portal demo)", externalAppUserId: "portal-alex" },
  { email: "sam@example.com", password: "review-sam", name: "Sam (portal demo)", externalAppUserId: "portal-sam" },
  { email: "riley@example.com", password: "review-riley", name: "Riley (portal demo)", externalAppUserId: "portal-riley" },
];

async function findOrCreateAppUser(spec) {
  const existing = await client.users.getUsers({
    externalAppUserId: spec.externalAppUserId,
    fields: ["id", "name", "login"],
  });
  const hit = existing.entries?.[0];
  if (hit?.id) {
    return hit;
  }
  return client.users.createUser({
    name: spec.name,
    isPlatformAccessOnly: true,
    externalAppUserId: spec.externalAppUserId,
  });
}

const users = [];
for (const spec of specs) {
  const user = await findOrCreateAppUser(spec);
  users.push({ ...spec, id: user.id, login: user.login });
}

const library = await client.folders.getFolderItems(process.env.BOX_LIBRARY_FOLDER_ID, {
  queryParams: { fields: ["id", "name", "type"] },
});
const partner = library.entries?.find(
  (entry) => entry.type === "folder" && entry.name === "partner",
);
if (!partner?.id) {
  throw new Error("partner/ folder not found under the library");
}

const partnerItems = await client.folders.getFolderItems(partner.id, {
  queryParams: { fields: ["id", "name", "type"] },
});
const battlecards = (partnerItems.entries ?? []).filter(
  (entry) =>
    entry.type === "file" &&
    typeof entry.name === "string" &&
    entry.name.includes("battlecard"),
);

const alex = users[0];
const sam = users[1];

async function collaborate(item, userId) {
  try {
    await client.userCollaborations.createCollaboration({
      item,
      accessibleBy: { type: "user", id: userId },
      role: "viewer",
    });
  } catch (error) {
    if (!String(error.message).includes("409")) {
      throw error;
    }
  }
}

await collaborate({ type: "folder", id: partner.id }, alex.id);

for (const file of battlecards) {
  await collaborate({ type: "file", id: file.id }, sam.id);
}

const probe = await client.withAsUserHeader(alex.id).users.getUserMe();

const reviewers = users.map((user) => ({
  email: user.email,
  password: user.password,
  boxUserId: user.id,
}));
writeFileSync("demo-reviewers.json", `${JSON.stringify(reviewers, null, 2)}\n`);

const envPath = ".env";
const envText = readFileSync(envPath, "utf8");
const nextEnv = envText.includes("BOX_DEMO_PARTNER_USER_ID=")
  ? envText.replace(
      /^BOX_DEMO_PARTNER_USER_ID=.*$/m,
      `BOX_DEMO_PARTNER_USER_ID=${alex.id}`,
    )
  : `${envText.trimEnd()}\nBOX_DEMO_PARTNER_USER_ID=${alex.id}\n`;
writeFileSync(envPath, nextEnv);

console.log(
  JSON.stringify(
    {
      asUserOk: probe.login,
      partnerFolderId: partner.id,
      battlecardFiles: battlecards.map((file) => ({ id: file.id, name: file.name })),
      reviewers: users.map((user) => ({
        email: user.email,
        boxUserId: user.id,
        login: user.login,
      })),
    },
    null,
    2,
  ),
);
