import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { aimlFetch, AimlApiError } from "../api/client.js";
import type { Config } from "../config.js";

interface VideoGenerationResponse {
  id: string;
  status: string;
  meta?: {
    usage?: {
      credits_used?: number;
    };
  };
  [key: string]: unknown;
}

export function registerVideoTools(server: McpServer, config: Config): void {
  server.tool(
    "aiml_generate_video",
    "Generate a video from a text prompt using the AIML API (Kling AI). Returns a generation_id — use aiml_get_video_status to poll for the result.",
    {
      prompt: z.string().describe("A text description of the video to generate"),
      model: z.string().optional().default("kling-video/v1/standard/text-to-video").describe(
        "The video generation model to use. Example: 'kling-video/v1/standard/text-to-video'"
      ),
      aspect_ratio: z.enum(["16:9", "9:16", "1:1"]).optional().default("16:9").describe("Video aspect ratio"),
      duration: z.union([z.literal(5), z.literal(10)]).optional().default(5).describe("Video duration in seconds (5 or 10)"),
      negative_prompt: z.string().optional().describe("What to avoid in the video"),
      cfg_scale: z.number().optional().describe("Classifier-free guidance scale"),
    },
    async (params) => {
      try {
        const result = await aimlFetch<VideoGenerationResponse>("/v2/video/generations", {
          method: "POST",
          body: params,
          config,
        });
        return {
          content: [{
            type: "text",
            text: `Video generation queued.\ngeneration_id: ${result.id}\nstatus: ${result.status}\n\nUse aiml_get_video_status with this generation_id to poll until status is 'completed', then retrieve the video URL.`,
          }],
        };
      } catch (err) {
        const message = err instanceof AimlApiError ? err.message : String(err);
        return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
      }
    },
  );
}
