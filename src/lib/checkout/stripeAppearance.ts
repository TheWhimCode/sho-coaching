// src/lib/checkout/stripeAppearance.ts
import type { Appearance } from "@stripe/stripe-js";

export const appearanceDarkBrand: Appearance = {
  theme: "night",
  variables: {
    colorPrimary: "#ffffffff",
    colorBackground: "#141E3B",
    colorText: "rgba(255,255,255,0.92)",
    colorTextSecondary: "rgba(255,255,255,0.65)",
    colorDanger: "#ff6b6b",
    borderRadius: "12px",
    spacingUnit: "5px",
    fontSizeBase: "15px",
  },
  rules: {
    // Wrapper around methods
    ".Tab, .Block": {
      padding: "20px 20px",
      backgroundColor: "#141E3B",
      borderColor: "rgba(146,180,255,0.18)",
    },
    ".Tab--selected": { backgroundColor: "#0e1527" },

    // Inner selected panel
    ".Block--highlight": {
      backgroundColor: "#0e1527",
      borderColor: "rgba(146,180,255,0.22)",
    },

    // Inputs
    ".Input": {
      padding: "14px 14px",
      backgroundColor: "rgba(255,255,255,0.05)",
      borderColor: "rgba(146,180,255,0.22)",
      boxShadow: "none",
    },
    ".Input:focus": { borderColor: "rgba(252,136,3,0.6)" },
    ".Input--invalid": { borderColor: "rgba(146,180,255,0.22)", boxShadow: "none" },

    ".Button": { padding: "12px 14px", borderRadius: "12px" },
    ".Label": { fontSize: "13px", color: "rgba(255,255,255,0.75)" },
    ".Text": { fontSize: "14px", color: "rgba(255,255,255,0.88)" },

    // Hide helper/error text
    ".Error": { display: "none" },
    ".ErrorIcon": { display: "none" },
    ".Text--error": { display: "none" },
  },
};
