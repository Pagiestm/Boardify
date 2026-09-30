import { hc } from "hono/client";

import { AppType } from "@/app/api/[[...route]]/route";

// In the browser, call the API on the current origin so the app works on any port/domain.
const baseUrl =
  typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL!;

export const client = hc<AppType>(baseUrl);
