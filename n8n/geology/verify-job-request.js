const crypto = require("node:crypto");
function header(name) { return $json.headers?.[name] || $json.headers?.[name.toLowerCase()] || ""; }
function fail() { throw new Error("Unauthorized"); }
const { jobId, jobAccessToken } = $json.body || {};
const timestamp = String(header("x-usta-timestamp")).trim();
const nonce = String(header("x-usta-nonce")).trim();
const signature = String(header("x-usta-signature")).trim();
const secret = $env.USTABIM_INTERNAL_SECRET;
if (typeof jobId !== "string" || typeof jobAccessToken !== "string" || !timestamp || !nonce || !signature || !secret || secret.length < 32) fail();
if (!/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) fail();
const raw = JSON.stringify({ jobId, jobAccessToken });
const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${nonce}.${raw}`).digest("hex");
const a = Buffer.from(signature); const b = Buffer.from(expected);
if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) fail();
return [{ json: { jobId, tokenHash: crypto.createHash("sha256").update(jobAccessToken).digest("hex"), nonce, expiresAt: new Date(Date.now() + 300000).toISOString() } }];
