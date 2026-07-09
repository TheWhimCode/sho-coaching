import type { GuidePossessionSectionConfig } from "@/lib/guides/possessionGuideTypes";

export const VIEGO_POSSESSIONS_SECTION: GuidePossessionSectionConfig = {
  heading: "Possessions",
  subtitle: "General rules for when R wins fights and when it throws.",
  howItWorksHeading: "How possessions work",
  howItWorksNote: "You keep your items. You use their abilities and HP.",
  flow: [
    { id: "kill", label: "Kill a champion" },
    { id: "soul", label: "Soul appears" },
    { id: "r", label: "Press R", highlightR: true },
    { id: "body", label: "You possess them" },
    { id: "again", label: "Kill again or disengage" },
  ],
  strongHeading: "Strong to possess",
  strongRules: [
    { id: "mobility", icon: "mobility", text: "Dash, blink, or MS to reach the next target" },
    { id: "burst", icon: "burst", text: "Real burst — can oneshot a second carry" },
    { id: "cc", icon: "cc", text: "Hard CC or a fight-winning ult" },
    { id: "survive", icon: "survive", text: "Tankiness when you're low HP" },
  ],
  skipHeading: "Don't possess",
  skipRules: [
    { id: "no-reach", icon: "no-reach", text: "Can't get to anyone worth killing" },
    { id: "no-damage", icon: "no-damage", text: "Utility body with no damage on your build" },
    { id: "low-hp", icon: "low-hp", text: "You'll die before you cast" },
    { id: "hold-r", icon: "hold-r", text: "Fight isn't worth it — hold R for a better angle" },
  ],
};
