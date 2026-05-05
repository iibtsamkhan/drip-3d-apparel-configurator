import express from "express";
import * as dotenv from "dotenv";
import axios from "axios";
import requireUserAuth from "../middleware/requireUserAuth.js";

dotenv.config();

const router = express.Router();

const POLLINATIONS_ENDPOINT = "https://gen.pollinations.ai/v1/images/generations";
const DEFAULT_MODEL = process.env.POLLINATIONS_MODEL || "flux";
const DEFAULT_SIZE = "1024x1024";
const MAX_VARIATIONS = 4;
const REQUEST_TIMEOUT_MS = 90000;
const DEFAULT_SUGGESTION_LIMIT = 8;

const PROMPT_SUGGESTION_GROUPS = [
  { key: "trending", label: "Trending" },
  { key: "streetwear", label: "Streetwear" },
  { key: "anime", label: "Anime" },
  { key: "vintage", label: "Vintage" },
  { key: "minimal", label: "Minimal" },
];

const PROMPT_SUGGESTION_POOL = {
  trending: [
    "Y2K butterfly chrome emblem",
    "Japanese wave crest with bold outline",
    "Neo tribal dragon linework badge",
    "Acid smiley graffiti spray mark",
    "Cyber koi fish tattoo style graphic",
    "Retro motorsport sponsor patch collage",
    "Angel numbers varsity insignia",
    "Broken-heart street tag icon",
    "Chrome angel wings monogram",
    "Racing checker flame insignia",
    "Tattoo dagger with rose vector icon",
    "Graffiti bubble letter crown mark",
  ],
  streetwear: [
    "Heavy metal rose dagger logo",
    "Skull with racing flames in vector style",
    "Oversized varsity panther mascot",
    "Barcode and warning label collage",
    "Distressed monogram with paint drips",
    "Urban serpent around city skyline",
    "Spray-painted tiger claw logo",
    "Street-sign sticker bomb graphic",
    "Grunge smile badge with halftone texture",
    "Boxing club stamp emblem",
  ],
  anime: [
    "Shonen tiger spirit with speed lines",
    "Manga mecha emblem with kanji accents",
    "Samurai mask sticker style art",
    "Chibi oni mascot badge",
    "Cel-shaded phoenix symbol",
    "Anime thunder wolf crest",
    "Neko cyber helmet icon",
    "Kitsune flame crest in manga style",
    "Demon slayer sword insignia",
    "Shoujo starburst wing icon",
  ],
  vintage: [
    "1970s surf sunset poster icon",
    "Retro diner pinup patch style",
    "Old school tattoo swallow pair",
    "Classic collegiate arch typography badge",
    "90s grunge smiley sticker",
    "Vintage boxing club emblem",
    "Retro motel neon sign badge",
    "Classic road trip postcard logo",
    "Old school eagle crest patch",
    "Throwback baseball mascot mark",
  ],
  minimal: [
    "Single line tiger head icon",
    "Geometric crane monoline mark",
    "Minimal mountain horizon insignia",
    "Abstract orbit logo symbol",
    "Monochrome lightning bolt crest",
    "Simple yin-yang wave icon",
    "Clean lotus line emblem",
    "Minimal wolf head contour icon",
    "Negative space phoenix mark",
    "Monoline rose glyph",
  ],
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableStatus = (status) =>
  status === 408 || status === 429 || (status >= 500 && status <= 599);

const formatUtcDate = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const createNumericSeed = (seedText) => {
  let seed = 0;
  for (let index = 0; index < seedText.length; index += 1) {
    seed = (seed * 31 + seedText.charCodeAt(index)) >>> 0;
  }
  return seed || 1;
};

const seededShuffle = (items, numericSeed) => {
  const shuffled = [...items];
  let seed = numericSeed;
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const swapIndex = seed % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};

const buildEnhancedPrompt = (prompt, style) =>
  [
    "high quality t-shirt graphic design",
    "centered composition",
    "transparent background",
    "clean edges",
    "printable artwork",
    prompt,
    `${style.toLowerCase()} style`,
    "no photorealism",
    "vector illustration style",
  ].join(", ");

const toDataUrlFromArrayBuffer = (buffer, mimeType = "image/png") =>
  `data:${mimeType};base64,${Buffer.from(buffer).toString("base64")}`;

const fetchImageAsDataUrl = async (url) => {
  const imageResponse = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: REQUEST_TIMEOUT_MS,
    validateStatus: () => true,
  });

  if (imageResponse.status < 200 || imageResponse.status > 299) {
    const imageError = new Error(`Image fetch failed with HTTP ${imageResponse.status}`);
    imageError.status = imageResponse.status;
    throw imageError;
  }

  const mimeType = imageResponse.headers["content-type"] || "image/png";
  return toDataUrlFromArrayBuffer(imageResponse.data, mimeType);
};

const extractImageData = async (payload) => {
  const item = payload?.data?.[0] || payload?.images?.[0] || payload?.result?.[0];
  if (!item) {
    throw new Error("Pollinations returned an empty response.");
  }

  const base64Payload =
    item?.b64_json || item?.image_base64 || item?.base64 || payload?.b64_json;
  if (base64Payload) {
    return `data:image/png;base64,${base64Payload}`;
  }

  const imageUrl = item?.url || item?.image || item?.output;
  if (typeof imageUrl === "string" && imageUrl.length > 0) {
    return fetchImageAsDataUrl(imageUrl);
  }

  throw new Error("Pollinations response did not include image data.");
};

const requestVariation = async ({ prompt, seed, apiKey }) => {
  const response = await axios.post(
    POLLINATIONS_ENDPOINT,
    {
      model: DEFAULT_MODEL,
      prompt,
      size: DEFAULT_SIZE,
      n: 1,
      seed,
    },
    {
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      validateStatus: () => true,
    }
  );

  if (response.status < 200 || response.status > 299) {
    const error = new Error(`Pollinations HTTP ${response.status}`);
    error.status = response.status;
    const payload = response.data;
    error.message = payload?.error?.message || payload?.message || error.message;
    throw error;
  }

  return extractImageData(response.data);
};

router.get("/", (_, res) => {
  res.status(200).json({ message: "Pollinations route is live." });
});

router.get("/suggestions", requireUserAuth, (req, res) => {
  const requestedLimit = Number(req.query?.limit);
  const perGroupLimit = Number.isFinite(requestedLimit)
    ? Math.max(4, Math.min(12, Math.floor(requestedLimit)))
    : DEFAULT_SUGGESTION_LIMIT;

  const dateKey = formatUtcDate(new Date());
  const promptMap = {};

  PROMPT_SUGGESTION_GROUPS.forEach((group, index) => {
    const pool = PROMPT_SUGGESTION_POOL[group.key] || [];
    const seed = createNumericSeed(`${dateKey}:${group.key}:${index}`);
    promptMap[group.key] = seededShuffle(pool, seed).slice(0, perGroupLimit);
  });

  res.status(200).json({
    dateKey,
    groups: PROMPT_SUGGESTION_GROUPS,
    prompts: promptMap,
    source: "backend-daily-rotation",
  });
});

router.post("/generate", requireUserAuth, async (req, res) => {
  const apiKey = String(process.env.POLLINATIONS_API_KEY || "").trim();
  if (!apiKey) {
    return res.status(500).json({
      message:
        "Server is missing POLLINATIONS_API_KEY. Set it in server/.env and restart backend.",
    });
  }

  const rawPrompt = String(req.body?.prompt || "").trim();
  const style = String(req.body?.style || "Streetwear").trim() || "Streetwear";
  const requestedCount = Number(req.body?.count);
  const count = Number.isFinite(requestedCount)
    ? Math.max(1, Math.min(MAX_VARIATIONS, Math.floor(requestedCount)))
    : MAX_VARIATIONS;

  if (!rawPrompt) {
    return res.status(400).json({ message: "Prompt is required." });
  }

  const prompt = buildEnhancedPrompt(rawPrompt, style);
  const baseSeed = Date.now() + Math.floor(Math.random() * 100000);

  try {
    const variations = [];

    for (let index = 0; index < count; index += 1) {
      const seed = baseSeed + index * 7919;
      let imageData = "";
      let lastError = null;

      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          imageData = await requestVariation({ prompt, seed: seed + attempt * 31, apiKey });
          break;
        } catch (error) {
          lastError = error;
          if (attempt === 2 || !isRetryableStatus(error?.status)) {
            throw error;
          }
          await sleep(900 * (attempt + 1));
        }
      }

      if (!imageData && lastError) {
        throw lastError;
      }

      variations.push({
        id: `${seed}-${index}`,
        seed,
        imageData,
      });
    }

    return res.status(200).json({ variations });
  } catch (error) {
    console.error("Pollinations generation failed:", error?.message || error);
    const statusCode = error?.status && Number(error.status) >= 400 ? error.status : 500;
    return res.status(statusCode).json({
      message: error?.message || "Failed to generate design variations.",
    });
  }
});

export default router;
