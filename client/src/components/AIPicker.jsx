import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import Upscaler from "upscaler";
import x2Model from "@upscalerjs/esrgan-slim/2x";
import { removeBackground } from "@imgly/background-removal";
import CustomButton from "./CustomButton";

const STYLE_PRESETS = [
  "Vintage",
  "Anime",
  "Minimalist",
  "Streetwear",
  "Abstract",
];

const LOCAL_SUGGESTION_GROUPS = [
  { key: "trending", label: "Trending" },
  { key: "streetwear", label: "Streetwear" },
  { key: "anime", label: "Anime" },
  { key: "vintage", label: "Vintage" },
  { key: "minimal", label: "Minimal" },
];

const LOCAL_PROMPT_GROUPS = {
  trending: [
    "Y2K butterfly chrome emblem",
    "Japanese wave crest with bold outline",
    "Neo tribal dragon linework badge",
    "Acid smiley graffiti spray mark",
    "Cyber koi fish tattoo style graphic",
    "Retro motorsport sponsor patch collage",
    "Angel numbers varsity insignia",
    "Broken-heart street tag icon",
  ],
  streetwear: [
    "Heavy metal rose dagger logo",
    "Skull with racing flames in vector style",
    "Oversized varsity panther mascot",
    "Barcode and warning label collage",
    "Distressed monogram with paint drips",
    "Urban serpent around city skyline",
  ],
  anime: [
    "Shonen tiger spirit with speed lines",
    "Manga mecha emblem with kanji accents",
    "Samurai mask sticker style art",
    "Chibi oni mascot badge",
    "Cel-shaded phoenix symbol",
    "Anime thunder wolf crest",
  ],
  vintage: [
    "1970s surf sunset poster icon",
    "Retro diner pinup patch style",
    "Old school tattoo swallow pair",
    "Classic collegiate arch typography badge",
    "90s grunge smiley sticker",
    "Vintage boxing club emblem",
  ],
  minimal: [
    "Single line tiger head icon",
    "Geometric crane monoline mark",
    "Minimal mountain horizon insignia",
    "Abstract orbit logo symbol",
    "Monochrome lightning bolt crest",
    "Simple yin-yang wave icon",
  ],
};

const PROGRESS_STEPS = [
  { key: "generating", label: "Generating" },
  { key: "removing", label: "Removing Background" },
  { key: "enhancing", label: "Enhancing Quality" },
];

const VARIATION_COUNT = 4;
const REQUEST_TIMEOUT_MS = 120000;
const MAX_OUTPUT_DIMENSION = 1536;
const SERVER_BASE_URL = String(
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8080"
).replace(/\/+$/, "");
const POLLINATIONS_GENERATE_ENDPOINT = `${SERVER_BASE_URL}/api/v1/pollinations/generate`;
const POLLINATIONS_SUGGESTIONS_ENDPOINT = `${SERVER_BASE_URL}/api/v1/pollinations/suggestions`;

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Unable to load generated image variation."));
    image.src = src;
  });

const canvasToBlob = (canvas, mimeType = "image/png", quality = 0.92) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to encode image blob."));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });

const sourceToBlob = async (source) => {
  const response = await fetch(source, { cache: "no-store" });
  if (!response.ok) {
    const error = new Error(`Failed to fetch image source: HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const blob = await response.blob();
  if (!blob.type.startsWith("image/")) {
    throw new Error("Image source did not resolve to a valid image.");
  }
  return blob;
};

const isLikelyShaderIssue = (error) =>
  /shader|webgl|vertex|fragment|link/i.test(
    String(error?.message || error || "")
  );

const normalizeImageSourceToPngBlob = async (
  imageSource,
  maxDimension = MAX_OUTPUT_DIMENSION
) => {
  const image = await loadImage(imageSource);
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const maxEdge = Math.max(sourceWidth, sourceHeight);
  const scale = maxEdge > maxDimension ? maxDimension / maxEdge : 1;
  const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
  const targetHeight = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not initialize canvas context.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
  return canvasToBlob(canvas, "image/png");
};

const upscaleBlobWithCanvas = async (
  sourceBlob,
  factor = 2,
  maxDimension = MAX_OUTPUT_DIMENSION
) => {
  const sourceUrl = URL.createObjectURL(sourceBlob);
  try {
    const image = await loadImage(sourceUrl);
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;

    const rawTargetWidth = Math.max(1, Math.round(sourceWidth * factor));
    const rawTargetHeight = Math.max(1, Math.round(sourceHeight * factor));
    const maxEdge = Math.max(rawTargetWidth, rawTargetHeight);
    const scale = maxEdge > maxDimension ? maxDimension / maxEdge : 1;
    const targetWidth = Math.max(1, Math.round(rawTargetWidth * scale));
    const targetHeight = Math.max(1, Math.round(rawTargetHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not initialize fallback upscale context.");
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
    return canvasToBlob(canvas, "image/png");
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
};

const getReadablePollinationsError = (error) => {
  if (error?.status === 400) {
    return "Prompt is invalid. Update your text and try again.";
  }
  if (error?.status === 401 || error?.status === 403) {
    return "Backend Pollinations key is invalid or blocked.";
  }
  if (error?.status === 429) {
    return "Pollinations is rate-limiting requests. Wait a few seconds and try again.";
  }
  if (error?.status === 408) {
    return "Generation request timed out. Please retry.";
  }
  if (error?.status >= 500) {
    return "Backend generation failed. Check server/.env POLLINATIONS_API_KEY and retry.";
  }
  return error?.message || "Could not generate design variations.";
};

const fetchPromptSuggestions = async (token) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(POLLINATIONS_SUGGESTIONS_ENDPOINT, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = new Error(`Suggestions request failed with HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const payload = await response.json();
    const groups = Array.isArray(payload?.groups)
      ? payload.groups
          .map((group) => ({
            key: String(group?.key || "").trim(),
            label: String(group?.label || "").trim(),
          }))
          .filter((group) => group.key && group.label)
      : [];

    const prompts =
      payload?.prompts && typeof payload.prompts === "object" ? payload.prompts : {};

    if (!groups.length) {
      throw new Error("Suggestions payload has no groups.");
    }

    const normalizedPrompts = {};
    groups.forEach((group) => {
      const rawPrompts = Array.isArray(prompts[group.key]) ? prompts[group.key] : [];
      const cleanPrompts = rawPrompts
        .map((prompt) => String(prompt || "").trim())
        .filter(Boolean);
      normalizedPrompts[group.key] = cleanPrompts;
    });

    return {
      groups,
      prompts: normalizedPrompts,
      source: String(payload?.source || "backend"),
      dateKey: String(payload?.dateKey || ""),
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("Suggestions request timed out.");
      timeoutError.status = 408;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const fetchPollinationsVariations = async ({ prompt, style, count, token }) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(POLLINATIONS_GENERATE_ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        prompt,
        style,
        count,
      }),
    });

    if (!response.ok) {
      const error = new Error(`Backend returned HTTP ${response.status}`);
      error.status = response.status;
      try {
        const payload = await response.json();
        error.message = payload?.message || error.message;
      } catch {
        // Keep default message if body is not JSON.
      }
      throw error;
    }

    const payload = await response.json();
    const rawVariations = Array.isArray(payload?.variations) ? payload.variations : [];

    if (!rawVariations.length) {
      throw new Error("Backend returned no design variations.");
    }

    const createdUrls = [];
    const normalizedVariations = [];

    try {
      for (let index = 0; index < rawVariations.length; index += 1) {
        const variation = rawVariations[index];
        const source =
          variation?.imageData || variation?.imageUrl || variation?.url || "";

        if (!source) {
          throw new Error("Backend response contained an empty variation image.");
        }

        const blob = await sourceToBlob(source);
        const objectUrl = URL.createObjectURL(blob);
        createdUrls.push(objectUrl);
        normalizedVariations.push({
          id: variation?.id || `${variation?.seed || Date.now()}-${index}`,
          seed: variation?.seed || index,
          imageUrl: objectUrl,
        });
      }
    } catch (error) {
      createdUrls.forEach((url) => URL.revokeObjectURL(url));
      throw error;
    }

    return normalizedVariations;
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("Generation request timed out.");
      timeoutError.status = 408;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const getStepState = (currentStep, stepKey) => {
  const order = ["generating", "generated", "removing", "enhancing", "done"];
  const targetOrder = {
    generating: 0,
    removing: 2,
    enhancing: 3,
  };

  if (currentStep === "error") return "idle";

  const currentOrder = order.indexOf(currentStep);
  const stepOrder = targetOrder[stepKey];

  if (currentOrder === -1 || stepOrder === undefined) return "idle";
  if (currentOrder > stepOrder) return "complete";
  if (currentOrder === stepOrder) return "active";
  return "idle";
};

const AIPicker = ({ onApplyDesign, onStatusChange }) => {
  const { getToken } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [activeStyle, setActiveStyle] = useState("Streetwear");
  const [suggestionGroups, setSuggestionGroups] = useState(LOCAL_SUGGESTION_GROUPS);
  const [promptGroups, setPromptGroups] = useState(LOCAL_PROMPT_GROUPS);
  const [activeSuggestionGroup, setActiveSuggestionGroup] = useState("trending");
  const [suggestions, setSuggestions] = useState(LOCAL_PROMPT_GROUPS.trending);
  const [suggestionsSource, setSuggestionsSource] = useState("local");
  const [suggestionsDateKey, setSuggestionsDateKey] = useState("");
  const [variations, setVariations] = useState([]);
  const [selectedVariation, setSelectedVariation] = useState("");
  const [currentStep, setCurrentStep] = useState("idle");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [previewImage, setPreviewImage] = useState("");

  const upscalerRef = useRef(null);
  const previewUrlRef = useRef("");
  const variationUrlsRef = useRef([]);

  const revokeVariationUrls = () => {
    variationUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    variationUrlsRef.current = [];
  };

  const shuffleArray = (items) => {
    const nextItems = [...items];
    for (let index = nextItems.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [nextItems[index], nextItems[swapIndex]] = [
        nextItems[swapIndex],
        nextItems[index],
      ];
    }
    return nextItems;
  };

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      revokeVariationUrls();
      upscalerRef.current?.dispose?.();
    };
  }, []);

  useEffect(() => {
    const groupPrompts =
      promptGroups[activeSuggestionGroup] || LOCAL_PROMPT_GROUPS[activeSuggestionGroup] || [];
    const fallbackPrompts =
      LOCAL_PROMPT_GROUPS.trending.length > 0
        ? LOCAL_PROMPT_GROUPS.trending
        : groupPrompts;
    const sourcePrompts = groupPrompts.length > 0 ? groupPrompts : fallbackPrompts;
    if (!sourcePrompts.length) return;
    setSuggestions(shuffleArray(sourcePrompts));
  }, [activeSuggestionGroup, promptGroups]);

  useEffect(() => {
    let cancelled = false;

    const loadSuggestions = async () => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error("Missing session token.");
        }

        const payload = await fetchPromptSuggestions(token);
        if (cancelled) return;

        setSuggestionGroups(payload.groups);
        setPromptGroups(payload.prompts);
        setSuggestionsSource(payload.source);
        setSuggestionsDateKey(payload.dateKey);

        setActiveSuggestionGroup((previousGroup) => {
          if (payload.groups.some((group) => group.key === previousGroup)) {
            return previousGroup;
          }
          return payload.groups[0]?.key || "trending";
        });
      } catch {
        if (cancelled) return;
        setSuggestionsSource("local-fallback");
        setSuggestionsDateKey("");
      }
    };

    loadSuggestions();

    return () => {
      cancelled = true;
    };
  }, [getToken]);

  const getSuggestionsMetaLabel = () => {
    if (suggestionsSource === "local-fallback") {
      return "Offline fallback list";
    }

    if (suggestionsDateKey) {
      return `Daily picks • ${suggestionsDateKey}`;
    }

    return "Daily rotating feed";
  };

  const updateStatus = (type, text) => {
    onStatusChange?.({ type, text });
  };

  const shuffleSuggestions = () => {
    setSuggestions((previousSuggestions) => shuffleArray(previousSuggestions));
  };

  const applySuggestion = (suggestion, mode = "replace") => {
    const cleanSuggestion = String(suggestion || "").trim();
    if (!cleanSuggestion) return;

    setPrompt((previousPrompt) => {
      const cleanPrompt = String(previousPrompt || "").trim();
      if (mode === "append" && cleanPrompt) {
        const hasTrailingPunctuation = /[,.!?;:]$/.test(cleanPrompt);
        return hasTrailingPunctuation
          ? `${cleanPrompt} ${cleanSuggestion}`
          : `${cleanPrompt}, ${cleanSuggestion}`;
      }
      return cleanSuggestion;
    });

    updateStatus(
      "info",
      mode === "append"
        ? "Suggestion appended to prompt."
        : "Suggestion inserted. You can edit before generating."
    );
  };

  const generateVariations = async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setErrorMessage("Add a prompt before generating designs.");
      updateStatus("error", "Add a prompt before generating designs.");
      return;
    }

    revokeVariationUrls();
    setErrorMessage("");
    setVariations([]);
    setSelectedVariation("");
    setPreviewImage("");
    setCurrentStep("generating");
    setIsGenerating(true);
    updateStatus("info", "Generating 4 design variations...");

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Missing session token.");
      }

      const generatedVariations = await fetchPollinationsVariations({
        prompt: trimmedPrompt,
        style: activeStyle,
        count: VARIATION_COUNT,
        token,
      });

      variationUrlsRef.current = generatedVariations.map((item) => item.imageUrl);
      setVariations(generatedVariations);
      setCurrentStep("generated");
      updateStatus("success", "Choose one variation to process and apply.");
    } catch (error) {
      setCurrentStep("error");
      const readableError = getReadablePollinationsError(error);
      setErrorMessage(readableError);
      updateStatus("error", readableError);
    } finally {
      setIsGenerating(false);
    }
  };

  const getBackgroundRemovedBlob = async (imageUrl) => {
    try {
      return await removeBackground(imageUrl);
    } catch (error) {
      const fallbackResponse = await fetch(imageUrl);
      if (!fallbackResponse.ok) {
        throw error;
      }
      const imageBlob = await fallbackResponse.blob();
      return removeBackground(imageBlob);
    }
  };

  const upscaleImageToPngBlob = async (sourceBlob) => {
    if (!upscalerRef.current) {
      upscalerRef.current = new Upscaler({ model: x2Model });
    }

    const sourceUrl = URL.createObjectURL(sourceBlob);
    try {
      const sourceImage = await loadImage(sourceUrl);
      try {
        const upscaledResult = await upscalerRef.current.upscale(sourceImage, {
          output: "base64",
        });

        if (typeof upscaledResult !== "string") {
          throw new Error("Upscaler did not return a usable image output.");
        }

        return normalizeImageSourceToPngBlob(upscaledResult);
      } catch (error) {
        if (!isLikelyShaderIssue(error)) {
          throw error;
        }

        updateStatus(
          "info",
          "GPU upscaler is unavailable on this device. Using safe quality mode..."
        );
        upscalerRef.current?.dispose?.();
        upscalerRef.current = null;
        return upscaleBlobWithCanvas(sourceBlob, 2);
      }
    } finally {
      URL.revokeObjectURL(sourceUrl);
    }
  };

  const processVariation = async (variation) => {
    setIsProcessing(true);
    setErrorMessage("");
    setSelectedVariation(variation.id);
    setCurrentStep("removing");
    updateStatus("info", "Removing background...");

    try {
      let foregroundBlob;
      try {
        foregroundBlob = await getBackgroundRemovedBlob(variation.imageUrl);
      } catch (error) {
        if (!isLikelyShaderIssue(error)) {
          throw error;
        }
        updateStatus(
          "info",
          "GPU background removal is unavailable on this device. Using original variation."
        );
        foregroundBlob = await sourceToBlob(variation.imageUrl);
      }

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      previewUrlRef.current = URL.createObjectURL(foregroundBlob);
      setPreviewImage(previewUrlRef.current);

      setCurrentStep("enhancing");
      updateStatus("info", "Enhancing quality...");
      const finalDesignBlob = await upscaleImageToPngBlob(foregroundBlob);
      const finalDesignUrl = URL.createObjectURL(finalDesignBlob);

      onApplyDesign?.(finalDesignUrl);
      setCurrentStep("done");
      updateStatus(
        "success",
        "AI design applied. Enable Decal Edit to drag, rotate, and resize it on the shirt."
      );
    } catch (error) {
      setCurrentStep("error");
      const message =
        error?.message || "Failed during background removal or upscaling.";
      setErrorMessage(message);
      updateStatus("error", message);
    } finally {
      setIsProcessing(false);
    }
  };

  const regenerate = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
    revokeVariationUrls();
    setPreviewImage("");
    setVariations([]);
    setSelectedVariation("");
    setCurrentStep("idle");
    setErrorMessage("");
    updateStatus("info", "Write a new prompt and generate fresh variations.");
  };

  const promptLength = prompt.trim().length;

  return (
    <div className="aipicker-container ai-tool-panel">
      <div className="ai-panel-head">
        <p className="picker-title">AI Design Studio</p>
        <p className="picker-note">
          Generate 4 options, clean the background, and auto-enhance quality.
        </p>
      </div>

      <div className="ai-panel-body">
        <div className="ai-prompt-section">
          <div className="ai-section-head">
            <p className="ai-section-title">Prompt</p>
            <span className="ai-char-count">{promptLength}/280</span>
          </div>
          <textarea
            className="aipicker-textarea"
            placeholder="Describe the design you want on the shirt..."
            rows={4}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            maxLength={280}
          />
        </div>

        <div className="ai-suggestions-panel">
          <div className="ai-suggestions-head">
            <p className="ai-suggestions-title">Prompt Suggestions</p>
            <button
              type="button"
              className="ai-suggestions-shuffle"
              onClick={shuffleSuggestions}>
              Shuffle
            </button>
          </div>
          <p className="ai-suggestions-meta">{getSuggestionsMetaLabel()}</p>

          <div className="ai-suggestions-filters">
            {suggestionGroups.map((group) => (
              <button
                key={group.key}
                type="button"
                className={`ai-suggestions-filter ${
                  activeSuggestionGroup === group.key ? "is-active" : ""
                }`}
                onClick={() => setActiveSuggestionGroup(group.key)}>
                {group.label}
              </button>
            ))}
          </div>

          <div className="ai-suggestions-grid">
            {suggestions.map((suggestion) => (
              <div key={suggestion} className="ai-suggestion-row">
                <button
                  type="button"
                  className="ai-suggestion-chip"
                  onClick={() => applySuggestion(suggestion, "replace")}
                  title="Use this suggestion">
                  {suggestion}
                </button>
                <button
                  type="button"
                  className="ai-suggestion-append"
                  onClick={() => applySuggestion(suggestion, "append")}
                  title="Append this suggestion">
                  +
                </button>
              </div>
            ))}
          </div>

          <p className="ai-suggestions-note">
            Tap a suggestion to replace. Use <span>+</span> to append.
          </p>
        </div>

        <div className="ai-style-section">
          <div className="ai-section-head">
            <p className="ai-section-title">Style Presets</p>
          </div>
          <div className="ai-style-group">
            {STYLE_PRESETS.map((styleName) => (
              <button
                key={styleName}
                type="button"
                className={`ai-style-chip ${
                  activeStyle === styleName ? "is-active" : ""
                }`}
                onClick={() => setActiveStyle(styleName)}>
                {styleName}
              </button>
            ))}
          </div>
        </div>

        {variations.length > 0 && (
          <div className="ai-variations-wrap">
            <div className="ai-section-head">
              <p className="ai-section-title">Variations</p>
              <span className="ai-step-note">Pick one to apply</span>
            </div>
            <div className="ai-variations-grid">
              {variations.map((variationUrl, index) => (
                <button
                  key={variationUrl.id}
                  type="button"
                  className={`ai-variation-card ${
                    selectedVariation === variationUrl.id ? "is-selected" : ""
                  }`}
                  onClick={() => processVariation(variationUrl)}
                  disabled={isProcessing}>
                  <img
                    src={variationUrl.imageUrl}
                    alt={`Design variation ${index + 1}`}
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {previewImage && (
          <div className="ai-preview-box">
            <div className="ai-section-head">
              <p className="ai-preview-title">Transparent Preview</p>
            </div>
            <img src={previewImage} alt="Background removed preview" />
          </div>
        )}

        {errorMessage && <p className="ai-error-text">{errorMessage}</p>}
      </div>

      <div className="ai-action-row">
        <CustomButton
          type="filled"
          title={isGenerating ? "Generating..." : "Generate Designs"}
          handleClick={generateVariations}
          customStyles="flex-1 px-3 py-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.08em]"
          isDisabled={isGenerating || isProcessing}
          styleOverrides={{
            background:
              "linear-gradient(135deg, rgba(27, 76, 160, 0.96) 0%, rgba(44, 121, 225, 0.92) 52%, rgba(96, 86, 237, 0.92) 100%)",
            borderColor: "rgba(180, 214, 255, 0.72)",
            color: "#f5fbff",
          }}
        />
        <CustomButton
          type="outline"
          title="Regenerate"
          handleClick={regenerate}
          customStyles="flex-1 px-3 py-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.08em]"
          isDisabled={isGenerating || isProcessing}
          styleOverrides={{
            color: "#d7e7ff",
            borderColor: "rgba(112, 170, 255, 0.5)",
            backgroundColor: "rgba(11, 29, 62, 0.34)",
          }}
        />
      </div>

      <div className="ai-progress-list">
        {PROGRESS_STEPS.map((step) => {
          const state = getStepState(currentStep, step.key);
          return (
            <div key={step.key} className={`ai-progress-step ${state}`}>
              <span className="ai-progress-dot" />
              <span>{step.label}</span>
            </div>
          );
        })}
      </div>

      {isGenerating && (
        <div className="ai-status-block">
          <span className="ai-spinner" />
          <span>Generating 4 variations...</span>
        </div>
      )}

      {isProcessing && (
        <div className="ai-status-block">
          <span className="ai-spinner" />
          <span>
            {currentStep === "removing"
              ? "Removing background..."
              : "Enhancing quality..."}
          </span>
        </div>
      )}
    </div>
  );
};

export default AIPicker;
