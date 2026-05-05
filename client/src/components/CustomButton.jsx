import { useSnapshot } from "valtio";

import state from "../store";
import { getContrastingColor } from "../config/helpers";

const CustomButton = ({
  type,
  title,
  customStyles,
  handleClick,
  isDisabled = false,
  ariaLabel,
  styleOverrides,
}) => {
  const snap = useSnapshot(state);

  const generateStyle = (buttonType) => {
    if (isDisabled) {
      return {
        backgroundColor: "rgba(148, 163, 184, 0.12)",
        borderWidth: "1px",
        borderColor: "rgba(148, 163, 184, 0.25)",
        color: "rgba(226, 232, 240, 0.55)",
        boxShadow: "none",
      };
    }

    if (buttonType === "filled") {
      return {
        backgroundColor: snap.color,
        color: getContrastingColor(snap.color),
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: "1px",
        boxShadow: "0 12px 30px rgba(2, 8, 20, 0.45)",
      };
    } else if (buttonType === "outline") {
      return {
        borderWidth: "1px",
        borderColor: `${snap.color}B8`,
        backgroundColor: "rgba(11, 19, 38, 0.6)",
        color: snap.color,
      };
    }
  };

  return (
    <button
      type="button"
      className={`custom-btn inline-flex items-center justify-center px-2 py-1.5 rounded-xl transition-all duration-300 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-80 ${customStyles}`}
      style={{ ...generateStyle(type), ...styleOverrides }}
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={ariaLabel ?? title}
      title={title}>
      {title}
    </button>
  );
};

export default CustomButton;
