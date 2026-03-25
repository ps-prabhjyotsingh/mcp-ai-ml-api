import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { aimlFetch, AimlApiError } from "../api/client.js";
import type { Config } from "../config.js";

interface ImageGenerationData {
  url?: string;
  b64_json?: string;
  revised_prompt?: string;
}

interface ImageGenerationResponse {
  data?: ImageGenerationData[];
  [key: string]: unknown;
}

export function registerImageTools(server: McpServer, config: Config): void {
  server.tool(
    "aiml_generate_image",
    "Generate images from a text prompt using the AIML API. Supports 60+ models including Flux, DALL-E, Qwen, Stable Diffusion, and more.",
    {
      prompt: z.string().describe("A text description of the desired image"),
      model: z.string().optional().default("flux/schnell").describe(
        "The image generation model to use. Examples: 'flux/schnell', 'flux-pro', 'dall-e-3', 'alibaba/qwen-image', 'stable-diffusion-v3-medium'"
      ),
      n: z.number().int().min(1).max(10).optional().describe("Number of images to generate (1-10)"),
      size: z.string().optional().describe("Image size, e.g. '1024x1024', '512x512'"),
      quality: z.string().optional().describe("Image quality, e.g. 'standard' or 'hd'"),
      style: z.string().optional().describe("Image style, e.g. 'vivid' or 'natural'"),
      response_format: z.enum(["url", "b64_json"]).optional().default("url").describe("Response format: 'url' or 'b64_json'"),
    },
    async (params) => {
      try {
        const result = await aimlFetch<ImageGenerationResponse>("/v1/images/generations/", {
          method: "POST",
          body: params,
          config,
        });

        if (params.response_format === "b64_json" && Array.isArray(result.data)) {
          const content: Array<{ type: "text"; text: string } | { type: "image"; data: string; mimeType: string }> = [];
          for (const item of result.data) {
            if (item.b64_json) {
              if (item.revised_prompt) {
                content.push({ type: "text", text: `Revised prompt: ${item.revised_prompt}` });
              }
              content.push({ type: "image", data: item.b64_json, mimeType: "image/png" });
            }
          }
          if (content.length > 0) return { content };
        }

        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        const message = err instanceof AimlApiError ? err.message : String(err);
        return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
      }
    },
  );
}
