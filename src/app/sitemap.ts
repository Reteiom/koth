import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

const PAGES: { path: string; priority: number; changeFrequency: "hourly" | "daily" | "monthly" }[] = [
  { path: "", priority: 1, changeFrequency: "hourly" },
  { path: "/leaderboard", priority: 0.9, changeFrequency: "hourly" },
  { path: "/tokens", priority: 0.8, changeFrequency: "hourly" },
  { path: "/launch", priority: 0.8, changeFrequency: "monthly" },
  { path: "/history", priority: 0.6, changeFrequency: "hourly" },
  { path: "/how-it-works", priority: 0.6, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((page) => ({
    url: `${SITE_URL}${page.path}`,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
