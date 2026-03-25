import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../config.js";
import { registerImageTools } from "./images.js";
import { registerVideoTools } from "./videos.js";
import { registerTtsTools } from "./tts.js";
import { registerTaskTools } from "./tasks.js";

export function registerAllTools(server: McpServer, config: Config): void {
  registerImageTools(server, config);
  registerVideoTools(server, config);
  registerTtsTools(server, config);
  registerTaskTools(server, config);
}
