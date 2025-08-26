// e.g. src/lib/stripe/appearanceDarkBrand.ts
import type { Appearance } from "@stripe/stripe-js";

export const appearanceDarkBrand: Appearance = {
  theme: "night",
  variables: {
    colorPrimary: "#fc8803",
    colorBackground: "#151527ff",
    colorText: "rgba(255,255,255,0.92)",
    colorTextSecondary: "rgba(255,255,255,0.65)",
    colorDanger: "#ff6b6b",
    borderRadius: "12px",
    spacingUnit: "5px",
    fontSizeBase: "15px",
  },
  rules: {
    ".Tab, .Block": {
      padding: "20px 20px",
      backgroundColor: "rgba(255,255,255,0.04)",
      borderColor: "rgba(146,180,255,0.18)",
    },
    ".Tab": { minHeight: "40px" },
    ".Input": {
      padding: "14px 14px",
      backgroundColor: "rgba(255,255,255,0.05)",
      borderColor: "rgba(146,180,255,0.22)",
      boxShadow: "none",
    },
    ".Input:focus": { borderColor: "rgba(252,136,3,0.6)" },
    ".Button": { padding: "12px 14px", borderRadius: "12px" },
    ".Label": { fontSize: "13px", color: "rgba(255,255,255,0.75)" },
    ".Text":  { fontSize: "14px", color: "rgba(255,255,255,0.88)" },
    ".Block--highlight": {
      backgroundColor: "rgba(15,29,55,0.55)",
      borderColor: "rgba(105,168,255,0.25)",
    },

    // 🔴 Only red inputs; hide helper text
    ".Error": { display: "none" },
    ".Input--invalid": {
      borderColor: "#ff6b6b",
      boxShadow: "0 0 0 1px #ff6b6b inset",
    },
  },
};
