# AIML API MCP Server

A TypeScript [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that wraps the [AIML API](https://api.aimlapi.com), giving Claude Code and other MCP-compatible AI agents access to image generation, video generation, and text-to-speech — backed by 60+ models including Flux, DALL-E, Kling AI, ElevenLabs, and more.

## Tools

### Images
| Tool | Description |
|------|-------------|
| `aiml_generate_image` | Generate images from a text prompt. Supports 60+ models: Flux, DALL-E 3, Stable Diffusion, Qwen, and more. Returns a URL or base64. |

### Video
| Tool | Description |
|------|-------------|
| `aiml_generate_video` | Generate video from a text prompt (Kling AI, async). Returns a `generation_id` — poll with `aiml_get_video_status`. |
| `aiml_get_video_status` | Poll a video generation task by `generation_id`. Returns the video URL when `status` is `completed`. |

### Text-to-Speech
| Tool | Description |
|------|-------------|
| `aiml_text_to_speech` | Convert text to speech. Models: OpenAI TTS-1/HD, ElevenLabs, Deepgram Aura. Returns a CDN audio URL. |

### Async workflow — video generation

Video generation is asynchronous:

1. Call `aiml_generate_video` → get a `generation_id`
2. Call `aiml_get_video_status` with that ID repeatedly until `status` is `"completed"`
3. Retrieve the video URL from the completed response

Claude Code handles this loop automatically when asked to generate a video.

## Requirements

- Node.js 18+

## Installation

```bash
npm install
npm run build
```

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AIML_API_KEY` | Yes | — | Your AIML API key from [aimlapi.com](https://aimlapi.com) |
| `AIML_API_BASE_URL` | No | `https://api.aimlapi.com` | Override the API base URL |
| `PORT` | No | `3000` | HTTP server port (HTTP mode only) |

## Usage

### Claude Code — stdio (recommended for local use)

Add to your global `~/.claude.json` or a project-level `.mcp.json`:

```json
{
  "mcpServers": {
    "aiml": {
      "command": "node",
      "args": ["/path/to/mcp-ai-ml-api/dist/index.js"],
      "env": {
        "AIML_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Or register it with the CLI:

```bash
claude mcp add aiml -- node /path/to/mcp-ai-ml-api/dist/index.js
```

### Claude Code — HTTP (Docker or remote server)

Start the server in HTTP mode, then connect Claude Code to it:

```bash
# Start server
AIML_API_KEY=your-key node dist/index.js --http
# or
npm run start:http

# Connect Claude Code
claude mcp add --transport http aiml http://localhost:3000/mcp
```

Or add manually to `~/.claude.json`:

```json
{
  "mcpServers": {
    "aiml": {
      "type": "http",
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

A health check endpoint is available at `GET /health`.

### Other MCP clients (Cursor, Windsurf, Warp, etc.)

Any client that supports stdio MCP servers can use this server. Point it at `node dist/index.js` with `AIML_API_KEY` in the environment.

For HTTP-based clients (e.g. Warp.dev), start the server with `--http` and connect to `http://localhost:3000/mcp`.

### Development

```bash
npm run dev   # tsx watch mode — rebuilds on file changes
```

## Docker

The Docker image runs in HTTP mode (`--http`) by default, exposing port 3000.

### Quick start

```bash
docker run --rm \
  -e AIML_API_KEY=your-key \
  -p 3000:3000 \
  ghcr.io/ps-prabhjyotsingh/mcp-ai-ml-api:latest
```

Then connect Claude Code:

```bash
claude mcp add --transport http aiml http://localhost:3000/mcp
```

### Build locally

```bash
make build        # single-arch image
make run          # build + run (reads AIML_API_KEY from env)
```

### Docker Compose

```bash
cp .env.example .env   # add AIML_API_KEY
make up                # start detached
make logs              # tail logs
make down              # stop
```

`.env` is loaded automatically — no need to pass variables manually.

### Makefile reference

```
make help       Show available commands
make build      Build Docker image (local, single arch)
make buildx     Build multiarch image (amd64 + arm64)
make push       Build and push multiarch image to ghcr.io
make run        Run container (reads AIML_API_KEY from env)
make connect    Register server with Claude Code CLI
make up         Start with docker compose
make down       Stop docker compose
make logs       Tail docker compose logs
```

### Connect after starting Docker

```bash
make connect   # equivalent to: claude mcp add --transport http aiml http://localhost:3000/mcp
```

## Project Structure

```
src/
├── index.ts            # Entry point — stdio or HTTP based on --http flag
├── server.ts           # MCP server setup and tool registration
├── config.ts           # Environment loading
├── api/
│   └── client.ts       # Typed fetch wrapper (aimlFetch)
├── tools/
│   ├── index.ts        # registerAllTools() barrel
│   ├── images.ts       # aiml_generate_image
│   ├── videos.ts       # aiml_generate_video
│   ├── tts.ts          # aiml_text_to_speech
│   └── tasks.ts        # aiml_get_video_status
└── transport/
    ├── stdio.ts         # StdioServerTransport
    └── http.ts          # StreamableHTTPServerTransport
```

## License

MIT
