import { proxy } from "valtio";

export const defaultDesignState = {
  color: "#25185F",
  isLogoTexture: true,
  isFullTexture: false,
  logoDecal: "./sample.png",
  fullDecal: "./sample.png",
  decalPosition: [0, 0.04, 0.15],
  decalScale: 0.15,
  decalRotation: 0,
  decalEditMode: false,
  isDecalDragging: false,
};

const state = proxy({
  intro: true,
  ...defaultDesignState,
});

export const resetDesignState = () => {
  Object.entries(defaultDesignState).forEach(([key, value]) => {
    state[key] = Array.isArray(value) ? [...value] : value;
  });
};

export const applyDesignState = (designState = {}) => {
  Object.entries(defaultDesignState).forEach(([key, fallbackValue]) => {
    const nextValue = designState[key];
    if (Array.isArray(fallbackValue)) {
      state[key] = Array.isArray(nextValue) ? [...nextValue] : [...fallbackValue];
      return;
    }

    state[key] = nextValue ?? fallbackValue;
  });
};

export default state;
