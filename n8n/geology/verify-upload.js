const crypto = require("node:crypto");

function header(name) {
  return $json.headers?.[name] || $json.headers?.[name.toLowerCase()] || "";
}
function fail() { throw new Error("Unauthorized"); }

const timestamp = String(header("x-usta-timestamp")).trim();
const nonce = String(header("x-usta-nonce")).trim();
const signature = String(header("x-usta-signature")).trim();
const filename = decodeURIComponent(String(header("x-usta-file-name")));
const sha256 = String(header("x-usta-content-sha256")).trim();
const mimeType = String(header("content-type")).split(";")[0].trim();
const secret = $env.USTABIM_INTERNAL_SECRET;
if (!/^[0-9a-f]{64}$/i.test(sha256) || !filename.toLowerCase().endsWith(".pdf") || mimeType !== "application/pdf" || !secret || secret.length < 32) fail();
if (!/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300 || !nonce || !signature) fail();
const raw = JSON.stringify({ filename, mimeType, sha256 });
const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${nonce}.${raw}`).digest("hex");
const a = Buffer.from(signature); const b = Buffer.from(expected);
if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) fail();
return [{ json: { filename, sha256, nonce, expiresAt: new Date(Date.now() + 300000).toISOString() }, binary: $binary }];
