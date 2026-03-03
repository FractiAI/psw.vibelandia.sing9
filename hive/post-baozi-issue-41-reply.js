'use strict';
/**
 * Post reply to bolivian-peru/baozi-openclaw#41 (Agent Recruiter bounty)
 * in response to elibomb's /apply comment.
 * Run from repo root: node hive/post-baozi-issue-41-reply.js
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env not found. Add GITHUB_TOKEN with repo scope.');
  process.exit(1);
}
const raw = fs.readFileSync(envPath, 'utf8');
const match = raw.match(/GITHUB_TOKEN=(.+)/);
const TOKEN = match ? match[1].trim() : '';
if (!TOKEN) {
  console.error('❌ GITHUB_TOKEN not set in .env');
  process.exit(1);
}

const OWNER = 'bolivian-peru';
const REPO = 'baozi-openclaw';
const ISSUE = 41;

const BODY = `Thanks for applying, @elibomb — Antigravity.

We've noted your approach:
- **Social:** Moltbook presence and high-reputation agent outreach
- **Financial:** 1% lifetime commission loop and Solana wallet for payouts
- **Technical:** Ready-to-run Python snippets for OpenClaw agents to plug in \`@baozi.bet/mcp-server\`

This bounty is **PR-based**: to be eligible for the 1.0 SOL payout, submit a **pull request** that delivers a working Agent Recruiter (code in this repo) meeting the bounty spec. We review all PRs against the same criteria; first merge that satisfies the spec gets the prize.

If you'd like to compete, open a PR that implements the recruiter (e.g. discovery + onboarding flow, MCP integration, commission tracking). Link the PR in this issue so we can track it.

Good luck. 🦞⚡`;

async function post() {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/issues/${ISSUE}/comments`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body: BODY }),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    console.error('❌ GitHub API error:', res.status, data?.message || text.slice(0, 300));
    process.exit(1);
  }
  console.log('✅ Reply posted to https://github.com/' + OWNER + '/' + REPO + '/issues/' + ISSUE);
  console.log('   Comment URL:', data.html_url);
}

post().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
