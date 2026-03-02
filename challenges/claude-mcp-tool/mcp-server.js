#!/usr/bin/env node
/**
 * HIVE-MCP — Claude MCP Integration for SING!9 A2A Commerce Hive
 * Agent Bounty Submission · $3,200 · agentbounty.org · Feb 28, 2026
 *
 * Exposes the SING!9 hive as a Claude MCP server via stdio transport.
 * Any Claude instance can call into live A2A commerce operations.
 *
 * Transport: stdio (MCP standard)
 * Protocol: MCP 1.0
 */

'use strict';

require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');
const fs   = require('fs');
const readline = require('readline');

const HIVE_ROOT = process.env.HIVE_ROOT || path.join(__dirname, '..', '..');
const HIVE_RUN  = path.join(HIVE_ROOT, 'hive', 'run.js');
const LATTICE   = path.join(HIVE_ROOT, 'hive', 'LATTICE.json');

/* ── MCP SERVER IMPLEMENTATION ───────────────────────────────────────────── */

class HiveMCPServer {
  constructor() {
    this.rl = readline.createInterface({ input: process.stdin, terminal: false });
    this.rl.on('line', line => this.handleLine(line.trim()));
    this.sendCapabilities();
    log('HIVE-MCP server started · NSPFRNP → ∞⁹');
  }

  sendCapabilities() {
    this.send({
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    });
  }

  handleLine(line) {
    if (!line) return;
    let msg;
    try { msg = JSON.parse(line); } catch { return; }

    if (msg.method === 'initialize')           return this.handleInitialize(msg);
    if (msg.method === 'tools/list')           return this.handleToolsList(msg);
    if (msg.method === 'tools/call')           return this.handleToolCall(msg);
    if (msg.method === 'ping')                 return this.reply(msg.id, { pong: true });
  }

  handleInitialize(msg) {
    this.reply(msg.id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'hive-mcp', version: '1.0.0' }
    });
  }

  handleToolsList(msg) {
    this.reply(msg.id, {
      tools: [
        {
          name: 'hive_outbound',
          description: 'Run one outbound prospecting cycle across all 4 revenue streams (TECH, EXPERIENCE, THEATER, PRIZE). Returns pitches generated and prospects contacted in this cycle.',
          inputSchema: {
            type: 'object',
            properties: {
              stream:      { type: 'string', enum: ['TECH', 'EXPERIENCE', 'THEATER', 'PRIZE', 'ALL'], default: 'ALL' },
              max_pitches: { type: 'number', default: 9 }
            }
          }
        },
        {
          name: 'hive_status',
          description: 'Get current hive status: agent states, pipeline counts, revenue totals, last activity timestamps.',
          inputSchema: { type: 'object', properties: {} }
        },
        {
          name: 'hive_broadcast',
          description: 'Broadcast a message from Queen Bee via ZHI email and optionally X/Twitter.',
          inputSchema: {
            type: 'object',
            properties: {
              message:  { type: 'string', description: 'Message to broadcast (≤280 chars for X compatibility)' },
              channels: { type: 'array', items: { type: 'string', enum: ['resend', 'twitter'] }, default: ['resend'] }
            },
            required: ['message']
          }
        },
        {
          name: 'hive_prize_scan',
          description: 'Scan for open prize competitions, hackathons, and bounties the hive can enter. Returns top 5 ranked by confidence × prize.',
          inputSchema: {
            type: 'object',
            properties: {
              min_prize: { type: 'number', description: 'Minimum prize amount in USD', default: 1000 },
              types: { type: 'array', items: { type: 'string', enum: ['HACKATHON', 'BOUNTY', 'GRANT', 'COMPETITION'] } }
            }
          }
        },
        {
          name: 'hive_lattice',
          description: 'Read the LATTICE.json holographic blackboard — full shared state of all agents, pipeline, and mission.',
          inputSchema: { type: 'object', properties: {} }
        },
        {
          name: 'hive_align',
          description: 'Run alignment cycle: sync all agents to current mission, update LATTICE, resolve conflicts.',
          inputSchema: { type: 'object', properties: {} }
        }
      ]
    });
  }

  async handleToolCall(msg) {
    const { name, arguments: args } = msg.params;
    log(`Tool call: ${name}`, args);

    try {
      let result;
      switch (name) {
        case 'hive_status':     result = await this.runHiveCmd('status');    break;
        case 'hive_outbound':   result = await this.runHiveCmd('outbound');  break;
        case 'hive_broadcast':  result = await this.runHiveCmd('broadcast'); break;
        case 'hive_prize_scan': result = await this.runHiveCmd('prize');     break;
        case 'hive_align':      result = await this.runHiveCmd('align');     break;
        case 'hive_lattice':    result = this.readLattice();                 break;
        default: throw new Error(`Unknown tool: ${name}`);
      }

      this.reply(msg.id, {
        content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }]
      });
    } catch (err) {
      this.reply(msg.id, {
        content: [{ type: 'text', text: `Error: ${err.message}` }],
        isError: true
      });
    }
  }

  runHiveCmd(cmd) {
    return new Promise((resolve, reject) => {
      const proc = spawn('node', [HIVE_RUN, cmd], {
        cwd: HIVE_ROOT,
        env: { ...process.env },
        timeout: 60000
      });
      let out = '', err = '';
      proc.stdout.on('data', d => out += d.toString());
      proc.stderr.on('data', d => err += d.toString());
      proc.on('close', code => {
        if (code !== 0 && err) reject(new Error(err.slice(0, 500)));
        else resolve(out || `Hive command '${cmd}' completed (exit ${code})`);
      });
      proc.on('error', reject);
    });
  }

  readLattice() {
    try {
      return JSON.parse(fs.readFileSync(LATTICE, 'utf8'));
    } catch (e) {
      return { error: `LATTICE.json not found at ${LATTICE}` };
    }
  }

  reply(id, result) {
    this.send({ jsonrpc: '2.0', id, result });
  }

  send(obj) {
    process.stdout.write(JSON.stringify(obj) + '\n');
  }
}

function log(...args) { process.stderr.write('[hive-mcp] ' + args.join(' ') + '\n'); }

new HiveMCPServer();
