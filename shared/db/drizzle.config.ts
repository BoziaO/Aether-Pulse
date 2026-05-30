import { defineConfig } from "drizzle-kit";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

function normalizeDatabaseUrl(url: string): string {
  if (url.includes(":")) return url;

  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const workspaceRoot = path.resolve(currentDir, "../..");
  return pathToFileURL(path.resolve(workspaceRoot, url)).href;
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: normalizeDatabaseUrl(process.env.DATABASE_URL),
  },
});
