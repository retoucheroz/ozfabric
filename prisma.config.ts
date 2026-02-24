// This file configures Prisma CLI for migrations
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local first (Next.js style), fall back to .env
config({ path: ".env.local" });
config({ path: ".env" });

function cleanUrl(): string {
  let url = process.env["DATABASE_URL"] || "";
  // Remove channel_binding parameter which Prisma doesn't support
  url = url.replace(/&channel_binding=[^&]*/g, "");
  url = url.replace(/\?channel_binding=[^&]*&?/g, "?");
  return url;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: cleanUrl(),
  },
});
