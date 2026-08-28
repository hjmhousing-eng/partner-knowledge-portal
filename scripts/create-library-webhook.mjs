import { existsSync, readFileSync } from "node:fs";
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
const me = await client.users.getUserMe();
console.log("creating as", me.login);

const folderId = process.env.BOX_LIBRARY_FOLDER_ID;
const address =
  "https://partner-knowledge-portal.vercel.app/api/webhooks/box";
const triggers = [
  "FILE.UPLOADED",
  "FILE.RENAMED",
  "FILE.TRASHED",
  "FILE.DELETED",
  "FILE.RESTORED",
  "FILE.MOVED",
  "FILE.COPIED",
];
const body = {
  target: { id: folderId, type: "folder" },
  address,
  triggers,
};

try {
  const webhook = await client.webhooks.createWebhook(body);
  console.log(JSON.stringify({ id: webhook.id, address: webhook.address }, null, 2));
} catch (error) {
  const status = error?.responseInfo?.statusCode;
  console.log("service-account create failed", status ?? error.message);
  const asJosh = client.withAsUserHeader("21781609191");
  const webhook = await asJosh.webhooks.createWebhook(body);
  console.log(
    JSON.stringify(
      { id: webhook.id, address: webhook.address, via: "as-user-josh" },
      null,
      2,
    ),
  );
}
