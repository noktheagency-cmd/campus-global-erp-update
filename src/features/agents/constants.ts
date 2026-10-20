export const AGENT_PORTAL_STATUSES = [
  "READY",
  "PENDING",
  "SUSPENDED",
] as const;

export const AGENT_TIERS = ["STARTER", "GROWTH", "PREMIER"] as const;

export const AGENT_SOCIAL_PLATFORMS = [
  "INSTAGRAM",
  "FACEBOOK",
  "LINKEDIN",
  "TIKTOK",
  "YOUTUBE",
  "WEBSITE",
  "OTHER",
] as const;

export const AGENT_SOCIAL_PLATFORM_LABELS = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
  OTHER: "Digər",
  TIKTOK: "TikTok",
  WEBSITE: "Veb sayt",
  YOUTUBE: "YouTube",
} as const;
