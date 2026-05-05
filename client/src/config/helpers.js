export const downloadCanvasToImage = () => {
  const canvas = document.querySelector("canvas");
  if (!canvas) {
    return false;
  }

  try {
    const dataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");

    link.href = dataURL;
    link.download = "canvas.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch {
    return false;
  }
};

export const getCanvasImageDataUrl = () => {
  const canvas = document.querySelector("canvas");
  if (!canvas) {
    return "";
  }

  try {
    return canvas.toDataURL("image/png");
  } catch {
    return "";
  }
};

export const getCanvasPreviewDataUrl = ({
  maxDimension = 640,
  mimeType = "image/jpeg",
  quality = 0.82,
} = {}) => {
  const canvas = document.querySelector("canvas");
  if (!canvas) {
    return "";
  }

  try {
    const sourceWidth = canvas.width || canvas.clientWidth;
    const sourceHeight = canvas.height || canvas.clientHeight;
    const maxEdge = Math.max(sourceWidth, sourceHeight);
    const scale = maxEdge > maxDimension ? maxDimension / maxEdge : 1;
    const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
    const targetHeight = Math.max(1, Math.round(sourceHeight * scale));

    const previewCanvas = document.createElement("canvas");
    previewCanvas.width = targetWidth;
    previewCanvas.height = targetHeight;

    const ctx = previewCanvas.getContext("2d");
    if (!ctx) {
      return canvas.toDataURL("image/png");
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);

    return previewCanvas.toDataURL(mimeType, quality);
  } catch {
    return "";
  }
};

export const reader = (file) =>
  new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => resolve(fileReader.result);
    fileReader.readAsDataURL(file);
  });

export const sourceToDataUrl = async (source) => {
  if (!source || typeof source !== "string") {
    return "";
  }

  if (source.startsWith("data:")) {
    return source;
  }

  if (source.startsWith("./") || source.startsWith("/")) {
    return source;
  }

  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(`Failed to convert source to data URL: HTTP ${response.status}`);
  }

  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onloadend = () => resolve(fileReader.result);
    fileReader.onerror = () => reject(new Error("Failed to read blob source."));
    fileReader.readAsDataURL(blob);
  });
};

export const getContrastingColor = (color) => {
  // Remove the '#' character if it exists
  const hex = color.replace("#", "");

  // Convert the hex string to RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate the brightness of the color
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // Return black or white depending on the brightness
  return brightness > 128 ? "black" : "white";
};
