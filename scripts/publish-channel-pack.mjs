import { readFileSync } from "node:fs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { BoxCcgAuth, BoxClient, CcgConfig } from "box-typescript-sdk-gen";
import { generateByteStreamFromBuffer } from "box-typescript-sdk-gen/lib/internal/utils";

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

const copper = rgb(0.78, 0.35, 0.12);
const ink = rgb(0.08, 0.09, 0.09);
const muted = rgb(0.32, 0.34, 0.33);

function wrap(text, font, size, width) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > width) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function brandPdf(title, subtitle, pages) {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  for (let i = 0; i < pages.length; i += 1) {
    const page = doc.addPage([612, 792]);
    page.drawRectangle({ x: 0, y: 748, width: 612, height: 44, color: copper });
    page.drawText("HELIOS CONTROLS", {
      x: 48,
      y: 766,
      size: 11,
      font: bold,
      color: rgb(1, 1, 1),
    });
    page.drawText("Authorized distributor literature", {
      x: 360,
      y: 766,
      size: 9,
      font: regular,
      color: rgb(1, 1, 1),
    });
    page.drawText(title, { x: 48, y: 708, size: 18, font: bold, color: ink });
    page.drawText(subtitle, { x: 48, y: 688, size: 10, font: regular, color: muted });
    let y = 658;
    for (const block of pages[i]) {
      if (block.type === "h") {
        y -= 8;
        page.drawText(block.text, { x: 48, y, size: 12, font: bold, color: ink });
        y -= 18;
      } else if (block.type === "p") {
        for (const line of wrap(block.text, regular, 10, 516)) {
          if (y < 64) break;
          page.drawText(line, { x: 48, y, size: 10, font: regular, color: ink });
          y -= 14;
        }
        y -= 6;
      } else if (block.type === "table") {
        for (const row of block.rows) {
          if (y < 64) break;
          const isHead = row === block.rows[0];
          page.drawText(row[0], {
            x: 48,
            y,
            size: 9,
            font: isHead ? bold : regular,
            color: ink,
          });
          page.drawText(row[1], {
            x: 260,
            y,
            size: 9,
            font: isHead ? bold : regular,
            color: ink,
          });
          if (row[2]) {
            page.drawText(row[2], {
              x: 420,
              y,
              size: 9,
              font: isHead ? bold : regular,
              color: ink,
            });
          }
          y -= 14;
        }
        y -= 10;
      }
    }
    page.drawText(`HC-LIT  ·  ${title}  ·  Page ${i + 1} of ${pages.length}`, {
      x: 48,
      y: 36,
      size: 8,
      font: regular,
      color: muted,
    });
    page.drawText("© Helios Controls. Channel use only.", {
      x: 360,
      y: 36,
      size: 8,
      font: regular,
      color: muted,
    });
  }
  return Buffer.from(await doc.save());
}

const markdown = {
  "welcome.md": `# Helios Controls distributor library

This portal is the published reading surface for Helios Controls channel literature. Use it for product selection, program rules, and training. Documents assigned to your distributor agreement appear after you sign in.

## What you will find

- Public product overviews and datasheets suitable for sharing with consulting engineers and owners
- Confidential battlecards, multipliers, and competitive notes for contracted distributors
- Support and training calendars for the current program year

Questions about a file that should be on your account go to your regional channel manager, not to the library search panel.
`,
  "sku-a--overview.md": `# SKU-A Pulse Controller

The Pulse Controller is a compact DDC controller for packaged rooftop and indoor air handlers up to 40 tons. It ships with factory sequences for occupied/unoccupied, economizer, and staged heat, and it exposes BACnet MS/TP for supervisory integration.

## Typical applications

- Replacement of legacy unitary controllers on RTUs
- New packaged AHUs sold through Helios air-handler lines
- Light retrofit where a full plant controller is not justified

## Differentiation

Pulse ships with tested sequences and a documented I/O map. Commissioning time on a standard RTU is typically under two hours when the installing contractor follows the installation guide. For competitive displacement versus Acme UC-90, lead with sequence completeness and native BACnet—not list price.

Share the public datasheet with the engineer of record. Multipliers and objection handling stay on your signed-in library.
`,
  "sku-b--overview.md": `# SKU-B Air Handler

SKU-B is a double-wall indoor air handler from 8,000 to 24,000 CFM with factory-mounted Pulse controls as an option. Casings are 2-inch foam-injected, and coil sections are designed for 6-row chilled water or DX.

## When to specify

- Indoor mechanical rooms where sound and leakage matter
- Jobs that already standardize on Pulse for rooftops
- Retrofits replacing uninsulated built-up units

## Documentation

The public datasheet covers performance envelopes and connection sizes. Coil selections and sound data remain in the partner library because they are configuration-specific.
`,
  "support--getting-started.md": `# Getting started with Helios support

Warranty registration, replacement parts, and technical support run through the distributor of record.

1. Register equipment at commissioning using the serial label on the control enclosure.
2. Open parts orders against the job number in the Helios order portal.
3. For sequence questions, attach the as-built I/O list before calling product support.

On-site support is dispatched only after the installing contractor has completed the commissioning checklist in the installation guide.
`,
  "company--channel-program.md": `# Authorized distributor program

Helios sells commercial HVAC and controls exclusively through contracted distributors. The program covers stocking, project registration, and marketing fund eligibility.

## Obligations

- Maintain trained counter and outside sales coverage in the contracted territory
- Register projects above $25,000 equipment value before quoting special pricing
- Keep confidential literature off public websites and bid rooms

Program updates publish here and in the quarterly enablement playbook. Territory questions go to your channel manager.
`,
  "training--public-calendar.md": `# Public training calendar

Open enrollment classes are listed below. Partner-only labs and pricing workshops require sign-in.

| Date | Session | Format |
|---|---|---|
| 12 Sep 2026 | Pulse Controller fundamentals | Virtual, 3 hours |
| 24 Sep 2026 | Air handler selection | In person, Chicago |
| 8 Oct 2026 | BACnet integration lab | Virtual, 2 hours |

Register through your Helios account team. Seats are first-come for public sessions.
`,
  "sku-a--battlecard.md": `# SKU-A Pulse Controller battlecard

**Positioning:** The fastest path from a packaged unit to a documented BACnet point list.

**Primary competitor:** Acme UC-90. UC-90 is cheaper at list. It ships without economizer sequences and requires a paid tools license for point mapping.

**Talk track**

1. Ask whether the engineer specified sequences or only a controller.
2. Show the Pulse I/O map and factory economizer state chart (installation guide).
3. Do not lead with multiplier. If they press price, use the authorized band in the pricing sheet.

**Landmines:** Do not promise native BACnet/IP in this hardware generation. That is SKU-C, not yet released.

**Proof:** Two hospital RTU retrofits in Q2 cut commissioning from a day to a morning. Details are in win stories.
`,
  "sku-a--pricing.md": `# SKU-A authorized pricing

Confidential to contracted distributors. Do not forward this page.

| Package | List | Authorized multiplier | Notes |
|---|---|---|---|
| Pulse Controller, 24 VAC | $1,840 | 0.58 | Stock |
| Pulse + economizer board | $2,210 | 0.58 | Stock |
| Pulse + BACnet MS/TP option | $2,040 | 0.61 | 10-day |

Project registration above twenty-five controllers unlocks a 0.03 extra point with channel manager approval. See discount authorization.
`,
  "sku-a--objection-handling.md": `# SKU-A objection handling

**“UC-90 is enough.”** Enough for binary start/stop. Not enough if the spec calls for enthalpy economizer and a documented BACnet list. Walk the sequence table in the install guide.

**“We already own Acme tools.”** Pulse commissioning uses a browser to the onboard web server. No annual seat.

**“Lead time.”** Standard Pulse ships from Elk Grove in two business days. Optioned BACnet boards are ten days.

**“Can the owner log in to this portal?”** No. Public datasheets only. Sequences and multipliers stay on the distributor account.
`,
  "sku-a--win-stories.md": `# SKU-A win stories

**Midwest hospital RTU replacement, Q2 2026.** Twenty-two Pulse controllers replaced mixed unitary boards. Commissioning completed in four days with two techs. The consulting engineer accepted the factory sequences with one occupancy-schedule exception.

**School district packaged units, Q1 2026.** Pulse won on BACnet MS/TP to an existing supervisory server. Acme quoted a gateway. Helios quoted native MS/TP. Award at 0.58.

Do not publish owner names in public marketing without channel-manager sign-off.
`,
  "sku-b--battlecard.md": `# SKU-B Air Handler battlecard

Lead with casing leakage and factory Pulse option. Against field-built AHUs, the conversation is schedule risk, not CFM.

Do not discount below the authorized SKU-B band without a registered project. Coil extras are on the pricing sheet.
`,
  "sku-b--pricing.md": `# SKU-B authorized pricing

Confidential. Base unit multipliers assume standard 2-inch casing and chilled-water coil.

| CFM class | List | Multiplier |
|---|---|---|
| 8,000–12,000 | $28,400 | 0.62 |
| 12,000–18,000 | $36,900 | 0.62 |
| 18,000–24,000 | $44,200 | 0.64 |

DX coil, heat recovery, and sound attenuation are extras. Request a configured quote from order management.
`,
  "competitive--acme-controls.md": `# Competitive note: Acme Controls

Acme UC-90 is the common unitary alternative. Strengths: price, brand familiarity, large installed base. Weaknesses: sequences sold separately, BACnet via gateway, desktop tool license.

Do not disparage Acme in writing to the engineer. Contrast documented factory sequences and native MS/TP. If the job is already an Acme supervisory network, evaluate a gateway path before walking away.
`,
  "playbook--q3-enablement.md": `# Q3 enablement playbook

Priorities this quarter: Pulse stock on the shelf, SKU-B specified on indoor AHU replacements, and project registration before quoting.

- Complete Pulse fundamentals training if you have not in 12 months
- Register every job over $25,000 before sending multipliers
- Use the public datasheet in the engineer package; keep this playbook internal
`,
  "discount--authorization.md": `# Discount authorization

Extra points beyond the published multiplier require a registered project and written approval from the regional channel manager.

Submit: job name, competitor, volume, and requested point. Approvals expire in 45 days. Do not verbally commit a band that is not in the pricing sheet or an approval email.
`,
};

async function skuADatasheet() {
  return brandPdf(
    "SKU-A Pulse Controller",
    "Datasheet HC-A-DS-26  ·  Public  ·  Rev B",
    [
      [
        { type: "h", text: "Description" },
        {
          type: "p",
          text: "The Pulse Controller is a 24 VAC DDC controller for packaged rooftop and indoor air handlers. Factory sequences cover occupancy, economizer, and staged heat. BACnet MS/TP is available as a hardware option. This datasheet is approved for distribution to engineers and owners.",
        },
        { type: "h", text: "Ratings" },
        {
          type: "table",
          rows: [
            ["Attribute", "Specification", "Notes"],
            ["Supply", "24 VAC ±10%, 50/60 Hz", "Class 2"],
            ["I/O", "4 analog, 8 digital", "24 V sourcing"],
            ["Network", "BACnet MS/TP optional", "Not BACnet/IP"],
            ["Enclosure", "NEMA 1, DIN rail", "Indoor"],
            ["Ambient", "32–122 °F", "Non-condensing"],
            ["Listings", "UL 916, FCC Part 15", "US / Canada"],
          ],
        },
      ],
      [
        { type: "h", text: "Typical points" },
        {
          type: "p",
          text: "Occupied command, zone temperature, mixed air, outdoor air, fan status, two stages of heat, one stage of cool, economizer enable, and alarm. Point names follow the Helios object list shipped in firmware 2.4.",
        },
        { type: "h", text: "Installation" },
        {
          type: "p",
          text: "Mount on DIN rail in the unit control panel. Keep analog wiring away from VFDs. Commissioning steps, torque values, and lockout procedures are in the partner installation guide—not in this public datasheet.",
        },
        { type: "h", text: "Ordering" },
        {
          type: "table",
          rows: [
            ["Catalog", "Description", "Lead time"],
            ["PC-24", "Pulse Controller, 24 VAC", "Stock"],
            ["PC-24-ECON", "Pulse with economizer board", "Stock"],
            ["PC-24-MSTP", "Pulse with MS/TP option", "10 days"],
          ],
        },
      ],
    ],
  );
}

async function skuBDatasheet() {
  return brandPdf(
    "SKU-B Indoor Air Handler",
    "Datasheet HC-B-DS-26  ·  Public  ·  Rev A",
    [
      [
        { type: "h", text: "Description" },
        {
          type: "p",
          text: "SKU-B is a double-wall indoor air handler from 8,000 to 24,000 CFM. Two-inch foam-injected casing, pitched drain pan, and optional factory Pulse controls. Performance envelopes below are for cooling with 42 °F EWT and standard filters.",
        },
        { type: "h", text: "Performance envelope" },
        {
          type: "table",
          rows: [
            ["Model", "CFM", "External SP"],
            ["AH-08", "8,000–12,000", "2.5 in. w.g."],
            ["AH-12", "12,000–18,000", "3.0 in. w.g."],
            ["AH-18", "18,000–24,000", "3.5 in. w.g."],
          ],
        },
        { type: "h", text: "Connections" },
        {
          type: "p",
          text: "Chilled water coils are opposite-end connections as standard. DX coil and electric heat are configured to order. Sound power data is issued with the certified selection, not in this public sheet.",
        },
      ],
    ],
  );
}

async function skuAInstall() {
  return brandPdf(
    "SKU-A Pulse Controller",
    "Installation and commissioning guide HC-A-IG-26  ·  Confidential  ·  Rev C",
    [
      [
        { type: "h", text: "Audience" },
        {
          type: "p",
          text: "This guide is for installing contractors working under a Helios distributor. It is not for end-customer portals or public bid rooms. Complete lockout/tagout on the packaged unit before landing any I/O.",
        },
        { type: "h", text: "Mounting and torque" },
        {
          type: "table",
          rows: [
            ["Fastener", "Torque", "Notes"],
            ["DIN clip", "Hand tight", "Do not over-cam"],
            ["I/O terminals", "4.4 lbf·in", "18–22 AWG"],
            ["Earth lug", "12 lbf·in", "Green/yellow"],
            ["MS/TP shield drain", "4.4 lbf·in", "One end only"],
          ],
        },
        { type: "h", text: "Power" },
        {
          type: "p",
          text: "Feed from a dedicated 24 VAC Class 2 transformer sized for 20 VA plus accessories. Do not share the transformer with a communicating thermostat.",
        },
      ],
      [
        { type: "h", text: "Commissioning sequence" },
        {
          type: "p",
          text: "1. Verify 24 VAC and earth. 2. Load factory sequence 2.4 from the onboard web server. 3. Map occupancy from the supervisory system or local schedule. 4. Stroke economizer and confirm mixed-air rise. 5. Simulate heat and cool stages. 6. Export the BACnet object list and attach it to the job folder.",
        },
        { type: "h", text: "Acceptance" },
        {
          type: "p",
          text: "The unit is accepted when fan status matches command, mixed air tracks within 3 °F of setpoint in economizer mode, and there are no Class 1 alarms after one occupied period. Register the serial number the same day.",
        },
        { type: "h", text: "Safety" },
        {
          type: "p",
          text: "Do not defeat high-limit or smoke shutdown from Pulse. Those interlocks remain in the unit safety circuit. Helios product support will not walk through a live panel that has not been locked out.",
        },
      ],
    ],
  );
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

const root = await client.folders.getFolderItems(process.env.BOX_LIBRARY_FOLDER_ID, {
  queryParams: { fields: ["id", "name", "type"] },
});
const folders = Object.fromEntries(
  (root.entries ?? [])
    .filter((entry) => entry.type === "folder" && entry.name)
    .map((entry) => [entry.name, entry.id]),
);

async function putFile(folderId, name, bytes, contentType) {
  const items = await client.folders.getFolderItems(folderId, {
    queryParams: { fields: ["id", "name", "type"] },
  });
  const existing = items.entries?.find(
    (entry) => entry.type === "file" && entry.name === name,
  );
  const stream = generateByteStreamFromBuffer(bytes);
  if (existing?.id) {
    await client.uploads.uploadFileVersion(existing.id, {
      attributes: { name },
      file: stream,
      fileFileName: name,
      fileContentType: contentType,
    });
    return { name, action: "version", id: existing.id };
  }
  const uploaded = await client.uploads.uploadFile({
    attributes: { name, parent: { id: folderId } },
    file: stream,
    fileFileName: name,
    fileContentType: contentType,
  });
  return { name, action: "create", id: uploaded.entries?.[0]?.id };
}

const results = [];
for (const [name, body] of Object.entries(markdown)) {
  const folderId = name.includes("sku-a--overview") ||
    name.startsWith("welcome") ||
    name.startsWith("sku-b--overview") ||
    name.startsWith("support") ||
    name.startsWith("company") ||
    name.startsWith("training")
    ? folders.public
    : folders.partner;
  results.push(
    await putFile(
      folderId,
      name,
      Buffer.from(body, "utf8"),
      "text/markdown",
    ),
  );
}

results.push(
  await putFile(
    folders.public,
    "sku-a--datasheet.pdf",
    await skuADatasheet(),
    "application/pdf",
  ),
);
results.push(
  await putFile(
    folders.public,
    "sku-b--datasheet.pdf",
    await skuBDatasheet(),
    "application/pdf",
  ),
);
results.push(
  await putFile(
    folders.partner,
    "sku-a--install-guide.pdf",
    await skuAInstall(),
    "application/pdf",
  ),
);

console.log(JSON.stringify(results, null, 2));
