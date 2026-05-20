import type { ComponentType, CSSProperties } from "react";
import { FaDiscord, FaTiktok, FaTwitch } from "react-icons/fa6";
import { GraduationCap, Swords } from "lucide-react";

export type LinkTreeIconProps = {
  className?: string;
  style?: CSSProperties;
  stroke?: string;
  "aria-hidden"?: boolean;
};

export type IconRadiantStop = { offset: string; color: string };

export type LinkTreeLink = {
  id: string;
  label: string;
  description: string;
  href: string;
  external: boolean;
  Icon: ComponentType<LinkTreeIconProps>;
  /** Button ring / glow on hover */
  accent: string;
  glow: string;
  /** Icon tile (square) gradient */
  iconGradient: string;
  iconColor: string;
  /** Optional gold/purple etc. gradient on the icon stroke */
  iconRadiantStops?: IconRadiantStop[];
};

export const LINK_TREE_LINKS: LinkTreeLink[] = [
  {
    id: "coaching",
    label: "Coaching",
    description: "1-on-1 League of Legends coaching",
    href: "/coaching",
    external: false,
    Icon: GraduationCap,
    accent: "#E8C676",
    glow: "rgba(148, 163, 184, 0.32)",
    iconGradient:
      "linear-gradient(145deg, #030712 0%, #0f172a 32%, #1e293b 62%, #334155 88%, #475569 100%)",
    iconColor: "#e2e8f0",
    iconRadiantStops: [
      { offset: "0%", color: "#fde68a" },
      { offset: "38%", color: "#c4b5fd" },
      { offset: "68%", color: "#fbbf24" },
      { offset: "100%", color: "#f5e6b8" },
    ],
  },
  {
    id: "twitch",
    label: "Twitch",
    description: "Check in when I'm live (often)",
    href: "https://www.twitch.tv/itsMinooooo",
    external: true,
    Icon: FaTwitch,
    accent: "#9146FF",
    glow: "rgba(145, 70, 255, 0.5)",
    iconGradient:
      "linear-gradient(145deg, #3b0764 0%, #5b21b6 38%, #772CE8 62%, #9146FF 88%, #a78bfa 100%)",
    iconColor: "#ffffff",
  },
  {
    id: "discord",
    label: "Discord",
    description: "Come join to talk or ask questions :D",
    href: "https://discord.gg/HfvxZBp",
    external: true,
    Icon: FaDiscord,
    accent: "#5865F2",
    glow: "rgba(88, 101, 242, 0.48)",
    iconGradient:
      "linear-gradient(145deg, #1e1f22 0%, #313338 28%, #4752C4 58%, #5865F2 82%, #7b85ff 100%)",
    iconColor: "#ffffff",
  },
  {
    id: "skillcheck",
    label: "Skillcheck",
    description: "Daily knowledge check game I made",
    href: "/skillcheck",
    external: false,
    Icon: Swords,
    accent: "#EA580C",
    glow: "rgba(234, 88, 12, 0.48)",
    iconGradient:
      "linear-gradient(145deg, #431407 0%, #7C2D12 42%, #9A3412 70%, #C2410C 90%, #EA580C 100%)",
    iconColor: "#ffffff",
  },
  {
    id: "tiktok",
    label: "TikTok",
    description: "Tips, highlights and stuff I post",
    href: "https://www.tiktok.com/@itsMinooooo",
    external: true,
    Icon: FaTiktok,
    accent: "#9CA3AF",
    glow: "rgba(156, 163, 175, 0.28)",
    iconGradient:
      "linear-gradient(145deg, #0a0a0a 0%, #171717 42%, #2a2a2a 72%, #404040 100%)",
    iconColor: "#f5f5f5",
  },
];
