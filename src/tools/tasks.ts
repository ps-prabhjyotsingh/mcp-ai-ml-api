import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { aimlFetch, AimlApiError } from "../api/client.js";
import type { Config } from "../config.js";

export function registerTaskTools(server: McpServer, config: Config): void {
  server.tool(
    "aiml_get_video_status",
    "Check the status of a video generation task. Poll this until status is 'completed' or 'failed'. Returns the video URL when completed.",
    {
      generation_id: z.string().describe("The generation ID returned by aiml_generate_video"),
    },
    async ({ generation_id }) => {
      try {
        const result = await aimlFetch<unknown>(
          `/v2/video/generations?generation_id=${encodeURIComponent(generation_id)}`,
          {
            method: "GET",
            config,
          },
        );
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        const message = err instanceof AimlApiError ? err.message : String(err);
        return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
      }
    },
  );
}
