export const clerkPublishableKey =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

const clerkVariables = {
  colorPrimary: "#4b8ff9",
  colorBackground: "#0a1527",
  colorInputBackground: "rgba(7, 18, 37, 0.9)",
  colorInputText: "#edf6ff",
  colorText: "#edf6ff",
  colorTextSecondary: "#b7c7e2",
  colorNeutral: "#7aa3e7",
  colorDanger: "#ff7a9b",
  colorSuccess: "#63d8ae",
  borderRadius: "18px",
  fontFamily: '"Space Grotesk", sans-serif',
};

const clerkElements = {
  rootBox: {
    width: "100%",
  },
  cardBox: {
    width: "100%",
    boxShadow: "none",
  },
  card: {
    background:
      "linear-gradient(160deg, rgba(13, 27, 56, 0.96), rgba(8, 17, 36, 0.94))",
    border: "1px solid rgba(122, 175, 255, 0.2)",
    boxShadow: "0 24px 58px rgba(3, 10, 25, 0.58)",
    backdropFilter: "blur(18px)",
    width: "100%",
    padding: "2rem",
  },
  main: {
    gap: "1.25rem",
  },
  headerTitle: {
    color: "#f3f8ff",
    fontSize: "1.25rem",
    fontWeight: 700,
    letterSpacing: "-0.02em",
  },
  headerSubtitle: {
    color: "#b7c7e2",
  },
  socialButtonsBlockButton: {
    background: "rgba(11, 29, 62, 0.78)",
    border: "1px solid rgba(122, 175, 255, 0.22)",
    color: "#edf6ff",
    minHeight: "3rem",
  },
  socialButtonsBlockButtonText: {
    color: "#edf6ff",
    fontWeight: 600,
  },
  dividerLine: {
    background: "rgba(122, 175, 255, 0.16)",
  },
  dividerText: {
    color: "#9fb8dd",
  },
  formFieldLabel: {
    color: "#d7e7ff",
    fontSize: "0.78rem",
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  formFieldRow: {
    gap: "0.5rem",
  },
  formFieldInput: {
    background: "rgba(7, 18, 37, 0.9)",
    border: "1px solid rgba(122, 175, 255, 0.24)",
    color: "#edf6ff",
    boxShadow: "none",
    minHeight: "3rem",
  },
  formButtonPrimary: {
    background:
      "linear-gradient(135deg, rgba(27, 76, 160, 0.96) 0%, rgba(44, 121, 225, 0.92) 52%, rgba(96, 86, 237, 0.92) 100%)",
    color: "#f5fbff",
    border: "1px solid rgba(180, 214, 255, 0.72)",
    boxShadow: "0 18px 36px rgba(24, 69, 176, 0.34)",
    minHeight: "3rem",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  footer: {
    background: "transparent",
  },
  footerActionLink: {
    color: "#90bfff",
    fontWeight: 600,
  },
  identityPreviewText: {
    color: "#edf6ff",
  },
  identityPreviewEditButtonIcon: {
    color: "#90bfff",
  },
  navbar: {
    background: "rgba(9, 19, 40, 0.92)",
    borderRight: "1px solid rgba(122, 175, 255, 0.18)",
  },
  navbarButton: {
    color: "#d6e6ff",
  },
  navbarButtonActive: {
    background: "rgba(37, 83, 180, 0.22)",
    color: "#f3f8ff",
  },
  pageScrollBox: {
    background: "transparent",
  },
  profileSectionTitleText: {
    color: "#edf6ff",
  },
  profileSectionTitle: {
    color: "#edf6ff",
  },
  modalContent: {
    background:
      "linear-gradient(160deg, rgba(13, 27, 56, 0.98), rgba(8, 17, 36, 0.98))",
    border: "1px solid rgba(122, 175, 255, 0.2)",
  },
  modalCloseButton: {
    color: "#e7f1ff",
  },
  userButtonPopoverCard: {
    background:
      "linear-gradient(160deg, rgba(13, 27, 56, 0.98), rgba(8, 17, 36, 0.98))",
    border: "1px solid rgba(122, 175, 255, 0.2)",
    boxShadow: "0 24px 58px rgba(3, 10, 25, 0.58)",
  },
  userButtonPopoverActionButton: {
    color: "#edf6ff",
  },
  userButtonPopoverActionButtonText: {
    color: "#edf6ff",
  },
  userButtonPopoverFooter: {
    borderTop: "1px solid rgba(122, 175, 255, 0.12)",
  },
  userPreviewMainIdentifier: {
    color: "#edf6ff",
  },
  userPreviewSecondaryIdentifier: {
    color: "#a9bddb",
  },
  badge: {
    background: "rgba(37, 83, 180, 0.18)",
    color: "#dcecff",
  },
};

export const clerkAppearance = {
  baseTheme: undefined,
  variables: clerkVariables,
  elements: clerkElements,
};
