import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

let cachedApiKey: string | null = null;

/**
 * Retrieves the Gemini API Key.
 * Checks environment variable GEMINI_API_KEY first.
 * If USE_SECRET_MANAGER is enabled or the env var is missing,
 * fetches the secret from Google Cloud Secret Manager.
 */
export async function getGeminiApiKey(): Promise<string> {
  // If already cached in memory, return it
  if (cachedApiKey) {
    return cachedApiKey;
  }

  // 1. Direct environment variable (Primary in AI Studio and standard Cloud Run env-injection)
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
    cachedApiKey = process.env.GEMINI_API_KEY;
    return cachedApiKey;
  }

  // 2. Google Cloud Secret Manager fallback / explicit mode
  const useSecretManager = process.env.USE_SECRET_MANAGER === 'true' || !process.env.GEMINI_API_KEY;
  const projectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || process.env.PROJECT_ID;
  const secretName = process.env.GEMINI_SECRET_NAME || 'GEMINI_API_KEY';

  if (useSecretManager && projectId) {
    try {
      console.log(`[Secret Manager] Fetching secret ${secretName} from project ${projectId}...`);
      const client = new SecretManagerServiceClient();
      const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
      const [version] = await client.accessSecretVersion({ name });
      const payload = version.payload?.data?.toString();
      if (payload) {
        cachedApiKey = payload.trim();
        console.log(`[Secret Manager] Successfully retrieved ${secretName}`);
        return cachedApiKey;
      }
    } catch (err: unknown) {
      console.warn(`[Secret Manager] Could not load secret from GCP Secret Manager: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (process.env.GEMINI_API_KEY) {
    cachedApiKey = process.env.GEMINI_API_KEY;
    return cachedApiKey;
  }

  throw new Error('GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in environment or enable Google Cloud Secret Manager.');
}
