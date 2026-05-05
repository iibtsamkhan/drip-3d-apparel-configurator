import { SketchPicker } from "react-color";
import { useSnapshot } from "valtio";
import state from "../store";

const ColorPicker = () => {
  const snap = useSnapshot(state);

  return (
    <div className="colorpicker-popover">
      <p className="picker-title">Base Color</p>
      <SketchPicker
        color={snap.color}
        disableAlpha
        onChange={(color) => (state.color = color.hex)}
        presetColors={[
          "#ccc",
          "#EFBD4E",
          "#80C670",
          "#726DE8",
          "#353934",
          "#2CCCE4",
          "#ff8a65",
          "#7098DA",
          "#C19277",
          "#FF96AD",
          "#512314",
          "#1F3558",
          "#25185F",
        ]}
      />
    </div>
  );
};

export default ColorPicker;
