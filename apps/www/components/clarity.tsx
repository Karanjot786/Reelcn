"use client";

import Clarity from "@microsoft/clarity";
import { useEffect } from "react";

// Public project id from clarity.microsoft.com; it ships in the client tag either way.
const PROJECT_ID = "yj2t3rd5ev";

// Heatmaps and session recordings.
export function ClarityAnalytics() {
  useEffect(() => {
    // ponytail: no consent gate, add one if the site ever serves the EU under a cookie banner
    // Live domain only, so localhost and preview deploys stay out of the dashboard.
    if (window.location.hostname === "www.reelcn.dev") Clarity.init(PROJECT_ID);
  }, []);

  return null;
}
