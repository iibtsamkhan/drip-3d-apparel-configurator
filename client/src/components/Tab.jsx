import { useSnapshot } from "valtio";
import state from "../store";

const Tab = ({ tab, isFilterTab, isActiveTab, isEditorActive, handleClick }) => {
  const snap = useSnapshot(state);
  const isActive = isFilterTab ? isActiveTab : isEditorActive;
  const tabLabel = tab.label ?? tab.name;

  const activeStyles =
    isActive
      ? {
          background: `linear-gradient(160deg, ${snap.color}AA 0%, rgba(15, 23, 42, 0.55) 100%)`,
          borderColor: `${snap.color}CC`,
          boxShadow: `0 0 0 1px ${snap.color}55, 0 14px 26px rgba(2, 6, 23, 0.55)`,
          opacity: 1,
        }
      : { backgroundColor: "transparent", opacity: 1 };

  return (
    <button
      type="button"
      className={`tab-btn ${
        isFilterTab ? "filter-tab-btn glassmorphism" : "editor-tab-btn glassmorphism"
      }`}
      style={activeStyles}
      onClick={handleClick}
      title={tabLabel}
      aria-label={tabLabel}>
      <img
        src={tab.icon}
        alt={tab.name}
        className={`${
          isFilterTab ? "w-7 h-7 object-contain" : "w-9 h-9 object-contain"
        }`}
      />
      {isFilterTab && <span className="filter-tab-text">{tabLabel}</span>}
      {!isFilterTab && (
        <>
          <span className="editor-tab-label">{tabLabel}</span>
          {tab.hint && <span className="editor-tab-hint">{tab.hint}</span>}
        </>
      )}
    </button>
  );
};

export default Tab;
