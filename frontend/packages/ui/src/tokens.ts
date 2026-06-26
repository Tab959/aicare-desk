export const uiTokens = {
  color: {
    background: "#050512",
    surface: "rgba(22, 20, 42, 0.86)",
    surfaceStrong: "rgba(25, 24, 48, 0.98)",
    border: "rgba(167, 139, 250, 0.22)",
    borderSoft: "rgba(255, 255, 255, 0.09)",
    text: "#f8fafc",
    muted: "#aeb8d8",
    subtle: "#94a3b8",
    primary: "#7c3aed",
    accent: "#22d3ee",
    success: "#22c55e",
    warning: "#facc15",
    danger: "#fb7185"
  },
  radius: {
    sm: "12px",
    md: "16px",
    lg: "22px",
    xl: "28px",
    pill: "999px"
  },
  shadow: {
    panel: "0 24px 80px rgba(0, 0, 0, 0.36)",
    card: "0 18px 48px rgba(0, 0, 0, 0.22)",
    glow: "0 0 26px rgba(124, 58, 237, 0.48)"
  },
  motion: {
    fast: "150ms ease",
    normal: "180ms ease",
    slow: "240ms ease"
  }
} as const;

export type UiTone = "neutral" | "primary" | "info" | "success" | "warning" | "danger" | "muted";
export type UiSize = "sm" | "md" | "lg";
