const crypto = require("node:crypto");

function unauthorized(message) {
  const error = new Error(message);
  error.name = "UstaUnauthorizedError";
  throw error;
}

function readHeader(source, name) {
  const direct = source?.[name];
  if (typeof direct === "string" && direct.trim()) {
    return direct.trim();
  }

  const lower = source?.[name.toLowerCase()];
  if (typeof lower === "string" && lower.trim()) {
    return lower.trim();
  }

  return "";
}

const bodyMessage = $json?.body?.message;
if (typeof bodyMessage !== "string" || !bodyMessage.trim()) {
  unauthorized("Missing message");
}

const timestamp = readHeader($json?.headers, "X-Usta-Timestamp");
const nonce = readHeader($json?.headers, "X-Usta-Nonce");
const signature = readHeader($json?.headers, "X-Usta-Signature");
const secret = $env.USTABIM_INTERNAL_SECRET;

if (!timestamp || !nonce || !signature || typeof secret !== "string" || secret.length < 32) {
  unauthorized("Missing signature headers");
}

const timestampSeconds = Number(timestamp);
if (!Number.isInteger(timestampSeconds)) {
  unauthorized("Invalid timestamp");
}

const nowSeconds = Math.floor(Date.now() / 1000);
if (Math.abs(nowSeconds - timestampSeconds) > 300) {
  unauthorized("Expired timestamp");
}

const rawJson = JSON.stringify({ message: bodyMessage });
const expectedSignature = crypto
  .createHmac("sha256", secret)
  .update(`${timestamp}.${nonce}.${rawJson}`)
  .digest("hex");

const provided = Buffer.from(signature, "utf8");
const expected = Buffer.from(expectedSignature, "utf8");

if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
  unauthorized("Invalid signature");
}

const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

return [
  {
    json: {
      message: bodyMessage.trim(),
      nonce,
      expiresAt,
    },
  },
];
