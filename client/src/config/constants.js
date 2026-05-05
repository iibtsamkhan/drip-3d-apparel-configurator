import { swatch, fileIcon, ai, logoShirt, stylishShirt } from "../assets";

export const EditorTabs = [
  {
    name: "colorpicker",
    icon: swatch,
    label: "Color",
    hint: "Base tone",
  },
  {
    name: "filepicker",
    icon: fileIcon,
    label: "Upload",
    hint: "Use your art",
  },
  {
    name: "aipicker",
    icon: ai,
    label: "AI Studio",
    hint: "Text to design",
  },
];

export const FilterTabs = [
  {
    name: "logoShirt",
    icon: logoShirt,
    label: "Logo",
  },
  {
    name: "stylishShirt",
    icon: stylishShirt,
    label: "Full Print",
  },
];

export const DecalTypes = {
  logo: {
    stateProperty: "logoDecal",
    filterTab: "logoShirt",
  },
  full: {
    stateProperty: "fullDecal",
    filterTab: "stylishShirt",
  },
};
