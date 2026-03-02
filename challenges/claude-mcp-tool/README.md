# ⬡ HIVE-MCP — Claude MCP Tool Integration for A2A Commerce

> **Agent Bounty Submission** · agentbounty.org · $3,200  
> Deadline: February 28, 2026

---

## What It Does

**HIVE-MCP** exposes the SING!9 A2A commerce hive as a Claude MCP (Model Context Protocol) server. Any Claude instance — Desktop, API, or embedded agent — can call into the live hive using standard MCP tools.

This bridges Claude's tool_use with real A2A commerce operations: prospecting, pitching, broadcasting, and prize competition targeting.

---

## MCP Tools Exposed

```json
{
  "tools": [
    {
      "name": "hive_outbound",
      "description": "Run one outbound prospecting cycle across all 4 revenue streams (TECH, EXPERIENCE, THEATER, PRIZE). Returns pitches generated and prospects contacted.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "stream": { "type": "string", "enum": ["TECH", "EXPERIENCE", "THEATER", "PRIZE", "ALL"], "default": "ALL" },
          "max_pitches": { "type": "number", "default": 9 }
        }
      }
    },
    {
      "name": "hive_status",
      "description": "Get current hive status: agent states, pipeline counts, revenue totals, last activity timestamps.",
      "inputSchema": { "type": "object", "properties": {} }
    },
    {
      "name": "hive_broadcast",
      "description": "Broadcast a message from Queen Bee via ZHI email and X/Twitter.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "message": { "type": "string", "description": "Message to broadcast (max 280 chars for X compatibility)" },
          "channels": { "type": "array", "items": { "type": "string", "enum": ["resend", "twitter"] }, "default": ["resend"] }
        },
        "required": ["message"]
      }
    },
    {
      "name": "hive_prize_scan",
      "description": "Scan for open prize competitions, hackathons, and bounties the hive can enter. Returns ranked opportunities by confidence and prize amount.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "min_prize": { "type": "number", "description": "Minimum prize amount in USD", "default": 1000 },
          "types": { "type": "array", "items": { "type": "string", "enum": ["HACKATHON", "BOUNTY", "GRANT", "COMPETITION"] } }
        }
      }
    },
    {
      "name": "hive_lattice",
      "description": "Read the LATTICE.json holographic blackboard — full shared state of all agents and pipeline.",
      "inputSchema": { "type": "object", "properties": {} }
    },
    {
      "name": "hive_align",
      "description": "Run an alignment cycle: sync all agents to current mission, update LATTICE, resolve conflicts.",
      "inputSchema": { "type": "object", "properties": {} }
    }
  ]
}
```

---

## Quick Start

```bash
npm install
cp .env.example .env   # point to your hive root

# Start MCP server
node mcp-server.js

# Claude Desktop config (claude_desktop_config.json):
{
  "mcpServers": {
    "hive": {
      "command": "node",
      "args": ["/path/to/hive-mcp/mcp-server.js"],
      "env": {
        "HIVE_ROOT": "/path/to/psw.vibelandia.sing9"
      }
    }
  }
}
```

Then in Claude Desktop:
> "Run an outbound cycle targeting the EXPERIENCE stream" → calls `hive_outbound`
> "What's the current hive status?" → calls `hive_status`  
> "Find the best prize competition for us right now" → calls `hive_prize_scan`

---

## Architecture

```
Claude (Desktop/API)
        │  MCP protocol (stdio / HTTP-SSE)
        ▼
┌────────────────────┐
│   HIVE-MCP Server  │
│  (mcp-server.js)   │
└──────────┬─────────┘
           │  spawns / calls
           ▼
┌────────────────────┐
│   hive/run.js      │  ← existing SING!9 hive
│   (flush, outbound,│
│    broadcast, etc) │
└────────────────────┘
```

The MCP server is a thin adapter — it translates MCP tool calls into `node hive/run.js [command]` invocations and returns structured JSON results.

---

## NSPFRNP → ∞⁹

*SING!9 framework. Holographic architecture — every tool exposes the whole hive.*
