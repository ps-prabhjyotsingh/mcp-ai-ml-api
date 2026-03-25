import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { aimlFetch, AimlApiError } from "../api/client.js";
import type { Config } from "../config.js";

interface TtsResponse {
  audio?: { url?: string };
  meta?: { usage?: { credits_used?: number } };
  [key: string]: unknown;
}

export function registerTtsTools(server: McpServer, config: Config): void {
  server.tool(
    "aiml_text_to_speech",
    "Convert text to speech using the AIML API. Returns a CDN URL to the generated audio file. Models: 'openai/tts-1', 'openai/tts-1-hd', 'elevenlabs/eleven_multilingual_v2', '#g1_aura-asteria-en' (Deepgram).",
    {
      model: z.string().describe("TTS model, e.g. 'openai/tts-1', 'openai/tts-1-hd', 'elevenlabs/eleven_multilingual_v2'"),
      text: z.string().describe("The text to convert to speech"),
      voice: z.string().optional().describe("Voice to use, e.g. 'alloy', 'nova', 'echo', 'shimmer' (OpenAI); depends on model"),
      speed: z.number().min(0.25).max(4.0).optional().describe("Speech speed (0.25–4.0, default 1.0)"),
      response_format: z.enum(["mp3", "opus", "aac", "flac", "wav", "pcm"]).optional().describe("Audio format (default: mp3)"),
    },
    async ({ model, text, voice, speed, response_format }) => {
      try {
        const result = await aimlFetch<TtsResponse>("/v1/tts", {
          method: "POST",
          body: { model, text, voice, speed, response_format },
          config,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        const message = err instanceof AimlApiError ? err.message : String(err);
        return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
      }
    },
  );
}
