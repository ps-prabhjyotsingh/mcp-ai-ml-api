export interface Config {
  apiKey: string | undefined;  // AIML_API_KEY
  baseUrl: string;             // AIML_API_BASE_URL, default: https://api.aimlapi.com
  httpPort: number;            // PORT, default: 3000
}

export function loadConfig(): Config {
  return {
    apiKey: process.env.AIML_API_KEY,
    baseUrl: process.env.AIML_API_BASE_URL ?? "https://api.aimlapi.com",
    httpPort: parseInt(process.env.PORT ?? "3000", 10),
  };
}
