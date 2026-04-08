export type AppConfig = {
  host: string;
  port: number;
  databaseUrl: string;
  logLevel: string;
  corsOrigin: string;
  joinCodeTtlMinutes: number;
  authTokenSecret: string;
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
  supabaseServiceRoleKey: string | null;
  icsCollabAttachmentsBucket: string;
  icsCollabPublicBaseUrl: string | null;
};

function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value == null || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw.trim() === "") return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value)) throw new Error(`Invalid integer for ${name}: ${raw}`);
  return value;
}

function envOptional(name: string): string | null {
  const raw = process.env[name];
  if (raw == null) return null;
  const trimmed = raw.trim();
  return trimmed === "" ? null : trimmed;
}

export function loadConfig(): AppConfig {
  return {
    host: env("HOST", "0.0.0.0"),
    port: envInt("PORT", 8080),
    databaseUrl: env("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/hazmat_toolkit"),
    logLevel: env("LOG_LEVEL", "info"),
    corsOrigin: env("CORS_ORIGIN", "*"),
    joinCodeTtlMinutes: envInt("JOIN_CODE_TTL_MINUTES", 60),
    authTokenSecret: env("AUTH_TOKEN_SECRET", "hazmat-dev-secret-change-me"),
    supabaseUrl: envOptional("SUPABASE_URL"),
    supabaseAnonKey: envOptional("SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: envOptional("SUPABASE_SERVICE_ROLE_KEY"),
    icsCollabAttachmentsBucket: env("ICS_COLLAB_ATTACHMENTS_BUCKET", "ics-collab-attachments"),
    icsCollabPublicBaseUrl: envOptional("ICS_COLLAB_PUBLIC_BASE_URL")
  };
}
