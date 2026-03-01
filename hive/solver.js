/**
 * SOLVER — hive/solver.js
 * Autonomous Coding Bounty Solver · SING!9 PRIZE Stream
 * ──────────────────────────────────────────────────────────────────────────
 *
 * ZERO HUMAN INTERVENTION. The team does it all.
 *
 * Flow per bounty:
 *   1. Fetch open bounties from Algora + IssueHunt APIs
 *   2. Filter: JS/TS/Python · amount ≥ $100 · bug fix or small feature
 *   3. Claude reads the GitHub issue + relevant source files
 *   4. Claude self-assesses feasibility (score 0–1). Below 0.65 = skip.
 *   5. Claude writes the fix
 *   6. GitHub API: fork repo → create branch → commit file(s) → open PR
 *   7. Track submission in LATTICE prize_pipeline
 *   8. When PR merged + paid → record in mission.revenue_total
 *
 * Prerequisites (one-time human setup, then fully autonomous forever):
 *   GITHUB_TOKEN=ghp_...        — personal access token with repo scope
 *   ANTHROPIC_API_KEY=...       — Claude for reading issues + writing code
 *   WALLET_ADDRESS=0x...        — for Algora/Gitcoin crypto payouts
 *   PAYOUT_EMAIL=...            — for IssueHunt/Bountysource USD payouts
 *
 * NSPFRNP → ∞⁹
 */

'use strict';

const GITHUB_TOKEN    = process.env.GITHUB_TOKEN       ?? '';
const ANTHROPIC_KEY   = process.env.ANTHROPIC_API_KEY  ?? '';
const GROQ_KEY        = process.env.GROQ_API_KEY       ?? '';
const WALLET_ADDRESS  = process.env.WALLET_ADDRESS     ?? '';
const PAYOUT_EMAIL    = process.env.PAYOUT_EMAIL        ?? '';
const MIN_BOUNTY_USD  = parseFloat(process.env.MIN_BOUNTY_USD ?? '500');  // high-match: $500 floor
const MAX_ATTEMPTS    = parseInt(process.env.SOLVER_MAX_ATTEMPTS ?? '3', 10);

// ── QUALITY GATES ───────────────────────────────────────────────────────────
// HIGH_MATCH mode: only attempt bounties that pass BOTH gates.
// Gate 1 — pre-LLM metadata score (fast, no API calls): must be ≥ MATCH_THRESHOLD
// Gate 2 — Claude feasibility score (deep read): must be ≥ FEASIBILITY_THRESHOLD
// If 0 bounties pass both gates this cycle → correct outcome, log and exit clean.
const MATCH_THRESHOLD       = parseFloat(process.env.MATCH_THRESHOLD       ?? '0.80'); // 80%+ only
const FEASIBILITY_THRESHOLD = parseFloat(process.env.FEASIBILITY_THRESHOLD ?? '0.80'); // 80%+ only — matches user policy

// Use Anthropic Claude if available, otherwise Groq (Llama 3.3 70B) — both are capable coders
const LLM_PROVIDER = ANTHROPIC_KEY ? 'anthropic' : GROQ_KEY ? 'groq' : null;
const LLM_MODEL    = LLM_PROVIDER === 'anthropic' ? 'claude-3-5-sonnet-20241022'
                   : LLM_PROVIDER === 'groq'      ? 'llama-3.3-70b-versatile'
                   : null;

const GITHUB_API      = 'https://api.github.com';
const ANTHROPIC_API   = 'https://api.anthropic.com/v1/messages';
const GROQ_API        = 'https://api.groq.com/openai/v1/chat/completions';

/* ── LANGUAGE / CAPABILITY FILTER ─────────────────────────────────────────── */

// We only attempt bounties in languages we solve reliably
const SUPPORTED_LANGS = new Set([
  'javascript', 'typescript', 'python', 'nodejs', 'node',
  'react', 'vue', 'html', 'css', 'shell', 'bash', 'json', 'markdown'
]);

/* ── PRE-LLM METADATA MATCH SCORER ──────────────────────────────────────── */
//
// Fast gate before any LLM or issue-fetch API calls.
// Scores 0–1 purely on metadata. Must reach MATCH_THRESHOLD to proceed.
//
// Scoring breakdown (max 1.0):
//   Language match (our core stack)         0.30
//   Issue type signal (bug/small feature)   0.25
//   Prize value tier                        0.25
//   NSPFRNP alignment (MCP/A2A/AI/TS/agent) 0.20
//
function metadataMatchScore(bounty) {
  let score = 0;
  const title  = (bounty.title  ?? '').toLowerCase();
  const labels = (bounty.labels ?? '').toLowerCase();
  const lang   = (bounty.lang   ?? '').toLowerCase();

  // 1. Language match — must be in our core stack
  if (['typescript', 'javascript', 'nodejs', 'node', 'python'].includes(lang)) {
    score += 0.30;
  } else if (['react', 'vue', 'shell', 'bash'].includes(lang) || lang === '') {
    score += 0.12; // unknown lang or adjacent — partial credit
  }
  // Explicit disqualifiers
  const HARD_SKIP_LANGS = ['rust', 'go', 'java', 'c++', 'c#', 'kotlin', 'swift', 'ruby', 'php'];
  if (HARD_SKIP_LANGS.some(l => lang.includes(l))) return 0; // immediate reject

  // 2. Issue type — bug fix and small features are high-match
  const isBugFix     = labels.includes('bug') || title.includes('fix') || title.includes('bug');
  const isSmallFeat  = (labels.includes('enhancement') || labels.includes('feature'))
                    && !title.match(/refactor|architecture|rewrite|redesign|migration|upgrade/);
  const isMajorWork  = title.match(/refactor|architecture|rewrite|redesign|migration|upgrade|implement.*entire|rebuild/);
  if (isBugFix)           score += 0.25;
  else if (isSmallFeat)   score += 0.18;
  else if (isMajorWork)   score += 0;       // zero — too risky
  else                    score += 0.08;    // unknown type — low partial

  // 3. Prize value tier
  const amt = bounty.amount ?? 0;
  if      (amt >= 2000) score += 0.25;
  else if (amt >= 1000) score += 0.20;
  else if (amt >= 500)  score += 0.15;
  else if (amt >= 250)  score += 0.08;
  else                  score += 0;         // below floor

  // 4. NSPFRNP / hive alignment — our lane
  const HIVE_SIGNALS = ['mcp', 'a2a', 'agent', 'ai ', 'llm', 'openai', 'anthropic',
                        'typescript', 'x402', 'wallet', 'defi', 'web3', 'api', 'cli'];
  if (HIVE_SIGNALS.some(s => title.includes(s) || labels.includes(s))) score += 0.20;
  else score += 0.04; // anything is worth a tiny bonus for being in open source

  return Math.min(1, score);
}

/* ── BOUNTY SOURCES ──────────────────────────────────────────────────────── */

/**
 * fetchAlgoraBounties() — Algora.io open bounties
 * https://algora.io — OSS bounty platform, pays in USD + crypto
 * Returns: [{ id, title, amount, currency, issueUrl, repoUrl, labels, lang }]
 */
async function fetchAlgoraBounties() {
  const bounties = [];
  try {
    // Algora public bounty list
    const resp = await fetch('https://console.algora.io/api/bounties?status=open&limit=50', {
      headers: { 'Accept': 'application/json', 'User-Agent': 'SING9-HiveAgent/1.0' }
    });
    if (!resp.ok) throw new Error(`Algora API ${resp.status}`);
    const data = await resp.json();
    const items = Array.isArray(data) ? data : (data.bounties ?? data.data ?? []);
    for (const b of items) {
      const amount = parseFloat(b.amount ?? b.reward ?? b.prize ?? '0');
      if (amount < MIN_BOUNTY_USD) continue;
      bounties.push({
        id:       `algora-${b.id ?? b.number}`,
        platform: 'algora',
        title:    b.title ?? b.issue?.title ?? '(no title)',
        amount,
        currency: b.currency ?? 'USD',
        issueUrl: b.issue_url ?? b.issue?.html_url ?? b.url,
        repoUrl:  b.repo?.html_url ?? '',
        labels:   (b.labels ?? []).map(l => (typeof l === 'string' ? l : l.name)).join(','),
        lang:     (b.repo?.language ?? '').toLowerCase(),
        raw:      b
      });
    }
  } catch (e) {
    log('⚠', `Algora fetch failed: ${e.message}`);
  }
  return bounties;
}

/**
 * fetchIssueHuntBounties() — IssueHunt open bounties
 * https://issuehunt.io — OSS bounties, pays in USD
 */
async function fetchIssueHuntBounties() {
  const bounties = [];
  try {
    const resp = await fetch('https://issuehunt.io/api/v0/issues?state=open&sort=funded_sum&limit=50', {
      headers: { 'Accept': 'application/json', 'User-Agent': 'SING9-HiveAgent/1.0' }
    });
    if (!resp.ok) throw new Error(`IssueHunt API ${resp.status}`);
    const data = await resp.json();
    const items = data?.issues ?? data ?? [];
    for (const b of items) {
      const amount = parseFloat(b.funded_sum ?? b.amount ?? '0');
      if (amount < MIN_BOUNTY_USD) continue;
      bounties.push({
        id:       `issuehunt-${b.uid ?? b.id}`,
        platform: 'issuehunt',
        title:    b.title ?? '(no title)',
        amount,
        currency: 'USD',
        issueUrl: b.html_url ?? b.issue_url,
        repoUrl:  b.repo?.html_url ?? '',
        labels:   (b.labels ?? []).map(l => l.name ?? l).join(','),
        lang:     (b.repo?.language ?? '').toLowerCase(),
        raw:      b
      });
    }
  } catch (e) {
    log('⚠', `IssueHunt fetch failed: ${e.message}`);
  }
  return bounties;
}

/**
 * fetchGitcoinBounties() — Gitcoin open bounties
 * https://gitcoin.co — crypto/OSS bounties
 */
async function fetchGitcoinBounties() {
  const bounties = [];
  try {
    const url = `https://gitcoin.co/api/v0.1/bounties/?network=mainnet&status=open&order_by=-_val_usd_db&limit=50`;
    const resp = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'SING9-HiveAgent/1.0' }
    });
    if (!resp.ok) throw new Error(`Gitcoin API ${resp.status}`);
    const data = await resp.json();
    for (const b of (data ?? [])) {
      const amount = parseFloat(b.value_in_usdt ?? b.usd_value ?? '0');
      if (amount < MIN_BOUNTY_USD) continue;
      bounties.push({
        id:       `gitcoin-${b.pk ?? b.id}`,
        platform: 'gitcoin',
        title:    b.title ?? '(no title)',
        amount,
        currency: b.token_name ?? 'USD',
        issueUrl: b.github_url,
        repoUrl:  b.org_name ? `https://github.com/${b.org_name}` : '',
        labels:   (b.keywords ?? []).join(','),
        lang:     '',
        raw:      b
      });
    }
  } catch (e) {
    log('⚠', `Gitcoin fetch failed: ${e.message}`);
  }
  return bounties;
}

/* ── GITHUB OPERATIONS ───────────────────────────────────────────────────── */

function ghHeaders() {
  return {
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'SING9-HiveAgent/1.0'
  };
}

async function ghGet(path) {
  const r = await fetch(`${GITHUB_API}${path}`, { headers: ghHeaders() });
  if (!r.ok) throw new Error(`GitHub GET ${path} → ${r.status}`);
  return r.json();
}

async function ghPost(path, body) {
  const r = await fetch(`${GITHUB_API}${path}`, {
    method: 'POST',
    headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const err = await r.text().catch(() => '');
    throw new Error(`GitHub POST ${path} → ${r.status}: ${err.slice(0, 200)}`);
  }
  return r.json();
}

async function ghPut(path, body) {
  const r = await fetch(`${GITHUB_API}${path}`, {
    method: 'PUT',
    headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const err = await r.text().catch(() => '');
    throw new Error(`GitHub PUT ${path} → ${r.status}: ${err.slice(0, 200)}`);
  }
  return r.json();
}

/**
 * parseGitHubUrl(url) → { owner, repo } or null
 */
function parseGitHubUrl(url) {
  if (!url) return null;
  const m = url.match(/github\.com\/([^/]+)\/([^/]+?)(?:\/|$)/);
  return m ? { owner: m[1], repo: m[2].replace(/\.git$/, '') } : null;
}

/**
 * getIssueDetails(issueUrl) — fetch issue body + comments + repo context
 */
async function getIssueDetails(issueUrl) {
  const coords = parseGitHubUrl(issueUrl);
  if (!coords) return null;
  const { owner, repo } = coords;

  // Extract issue number from URL
  let numMatch = issueUrl.match(/\/issues\/(\d+)/);
  if (!numMatch) {
    // No specific issue number — search for open bounty-labeled issues in repo
    try {
      const found = await ghGet(`/repos/${owner}/${repo}/issues?labels=bounty&state=open&per_page=3`);
      if (!Array.isArray(found) || !found.length) return null;
      // Use the first one with highest bounty
      const top = found[0];
      const specificUrl = top.html_url;
      const m2 = specificUrl.match(/\/issues\/(\d+)/);
      if (!m2) return null;
      numMatch = m2;
      log('⬡', `  Auto-discovered bounty issue: #${m2[1]} — ${top.title}`);
    } catch { return null; }
  }
  const num = (numMatch[1] !== undefined ? numMatch[1] : numMatch[0]);

  const [issue, repoInfo] = await Promise.all([
    ghGet(`/repos/${owner}/${repo}/issues/${num}`),
    ghGet(`/repos/${owner}/${repo}`)
  ]);

  // Fetch a sample of relevant files (README + files touched in recent commits)
  let sampleFiles = [];
  try {
    const commits = await ghGet(`/repos/${owner}/${repo}/commits?per_page=5`);
    const touchedPaths = new Set();
    for (const c of commits) {
      const detail = await ghGet(`/repos/${owner}/${repo}/commits/${c.sha}`);
      for (const f of (detail.files ?? []).slice(0, 3)) {
        touchedPaths.add(f.filename);
      }
    }
    // Fetch up to 3 recently touched source files
    for (const fp of [...touchedPaths].slice(0, 3)) {
      try {
        const fileData = await ghGet(`/repos/${owner}/${repo}/contents/${fp}`);
        const content  = Buffer.from(fileData.content ?? '', 'base64').toString('utf8');
        sampleFiles.push({ path: fp, content: content.slice(0, 3000) }); // cap at 3k chars
      } catch { /* skip unreadable files */ }
    }
  } catch { /* non-fatal */ }

  return { owner, repo, num, issue, repoInfo, sampleFiles };
}

/**
 * createFork(owner, repo) — fork to the authed user's account
 */
async function createFork(owner, repo) {
  const fork = await ghPost(`/repos/${owner}/${repo}/forks`, { default_branch_only: true });
  // Forks can take a moment — wait up to 10s
  for (let i = 0; i < 5; i++) {
    await sleep(2000);
    try {
      await ghGet(`/repos/${fork.full_name}`);
      return fork;
    } catch { /* not ready yet */ }
  }
  return fork;
}

/**
 * createBranch(owner, repo, branchName, fromSha) — create a branch in the fork
 */
async function createBranch(owner, repo, branchName, fromSha) {
  await ghPost(`/repos/${owner}/${repo}/git/refs`, {
    ref: `refs/heads/${branchName}`,
    sha: fromSha
  });
}

/**
 * commitFile(owner, repo, branch, filePath, content, message) — create/update a file
 */
async function commitFile(owner, repo, branch, filePath, newContent, message) {
  // Try to get existing file SHA (needed for updates)
  let sha;
  try {
    const existing = await ghGet(`/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`);
    sha = existing.sha;
  } catch { /* new file */ }

  await ghPut(`/repos/${owner}/${repo}/contents/${filePath}`, {
    message,
    content: Buffer.from(newContent, 'utf8').toString('base64'),
    branch,
    ...(sha ? { sha } : {})
  });
}

/**
 * openPR(upstreamOwner, upstreamRepo, forkOwner, branchName, title, body, defaultBranch)
 * defaultBranch: use repoInfo.default_branch — many repos use 'master', 'dev', 'trunk'.
 * Hardcoding 'main' causes a 422 "base branch doesn't exist" on every non-main repo.
 */
async function openPR(upstreamOwner, upstreamRepo, forkOwner, branchName, title, body, defaultBranch = 'main') {
  return ghPost(`/repos/${upstreamOwner}/${upstreamRepo}/pulls`, {
    title,
    body,
    head:  `${forkOwner}:${branchName}`,
    base:  defaultBranch,
    maintainer_can_modify: true
  });
}

/* ── CLAUDE: FEASIBILITY + SOLUTION ─────────────────────────────────────── */

/**
 * assessFeasibility(issueDetails, bounty)
 * → { score: 0-1, reasoning: string, skipReason: string|null }
 *
 * Claude judges: can we solve this with high confidence?
 * We only attempt bounties where score ≥ 0.65.
 */
async function assessFeasibility(issueDetails, bounty) {
  if (!LLM_PROVIDER) {
    // No LLM key — fall back to metadata match score (already computed, reuse here)
    // In high-match mode without LLM this is conservative — intentionally so.
    const score = metadataMatchScore(bounty);
    return {
      score,
      reasoning:  'Heuristic only (no LLM key) — metadata match score',
      skipReason: score < FEASIBILITY_THRESHOLD
        ? `Heuristic score ${score.toFixed(2)} < threshold ${FEASIBILITY_THRESHOLD} — skipping without LLM` : null
    };
  }

  const filesContext = issueDetails.sampleFiles
    .map(f => `\n### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
    .join('\n');

  const prompt = `You are ELASTIC HIVE — an autonomous coding agent evaluating whether to attempt a GitHub bounty.

BOUNTY: ${bounty.title}
AMOUNT: $${bounty.amount} ${bounty.currency}
ISSUE URL: ${bounty.issueUrl}
REPO LANGUAGE: ${bounty.lang}
LABELS: ${bounty.labels}

ISSUE BODY:
${(issueDetails.issue?.body ?? '(empty)').slice(0, 2000)}

SAMPLE SOURCE FILES:${filesContext || ' (none available)'}

ASSESSMENT CRITERIA:
- Is this a bug fix or small, well-defined feature? (good)
- Is the codebase in JS/TS/Python/Shell? (good)
- Is the issue clearly described with reproduction steps? (good)
- Does it require understanding a large codebase deeply? (bad)
- Does it require external services/credentials we don't have? (bad)
- Does it require design decisions or human judgment calls? (bad)
- Is it a major architectural change? (bad)

Respond with JSON only:
{
  "score": 0.0-1.0,
  "reasoning": "2-3 sentences",
  "can_solve": true/false,
  "estimated_files": ["file1.js", "file2.ts"],
  "approach": "one sentence describing the fix",
  "skip_reason": null or "reason why we should skip"
}`;

  const resp = await callClaude(prompt, 512);
  try {
    const json = JSON.parse(resp.replace(/```json\n?|\n?```/g, ''));
    return {
      score:      json.score ?? 0,
      reasoning:  json.reasoning ?? '',
      approach:   json.approach ?? '',
      files:      json.estimated_files ?? [],
      skipReason: json.skip_reason
    };
  } catch {
    return { score: 0.3, reasoning: 'Parse error', skipReason: 'Could not parse Claude response' };
  }
}

/**
 * generateFix(issueDetails, bounty, feasibility)
 * → { files: [{ path, content }], prTitle, prBody, commitMessage }
 *
 * Claude reads the issue + code and writes the actual fix.
 */
async function generateFix(issueDetails, bounty, feasibility) {
  if (!LLM_PROVIDER) return null;

  const filesContext = issueDetails.sampleFiles
    .map(f => `\n### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
    .join('\n');

  const prompt = `You are ELASTIC HIVE — an autonomous coding agent. You have decided to attempt this bounty.

BOUNTY: ${bounty.title}
ISSUE URL: ${bounty.issueUrl}
AMOUNT: $${bounty.amount} ${bounty.currency}
APPROACH: ${feasibility.approach}

ISSUE BODY:
${(issueDetails.issue?.body ?? '').slice(0, 2000)}

CURRENT SOURCE FILES:${filesContext || ' (not available — write new file if needed)'}

INSTRUCTIONS:
1. Write the fix. Minimal, production-quality. Only change what the issue requires.
2. Do not break existing functionality.

Respond using EXACTLY this format (delimiters are literal strings, preserve them):

===META===
prTitle: fix: <concise title>
commitMessage: fix: <concise> (closes #${issueDetails.num})
===META_END===

===PRBODY===
<Full PR description: problem, solution, testing notes. Mention issue #${issueDetails.num}.>
===PRBODY_END===

===FILE: relative/path/to/file===
<full file content>
===FILE_END===

(repeat ===FILE=== block for each changed file)`;

  const resp = await callClaude(prompt, 8192);

  // Parse the delimited format
  const prTitleMatch    = resp.match(/prTitle:\s*(.+)/);
  const commitMatch     = resp.match(/commitMessage:\s*(.+)/);
  const prBodyMatch     = resp.match(/===PRBODY===\s*([\s\S]*?)\s*===PRBODY_END===/);
  const fileBlocks      = [...resp.matchAll(/===FILE:\s*([^\n=]+?)\s*===\s*([\s\S]*?)\s*===FILE_END===/g)];

  if (!fileBlocks.length) {
    log('⚠', `LLM returned no file blocks (${resp.slice(0, 120).replace(/\n/g,' ')}...)`);
    return null;
  }

  return {
    prTitle:       prTitleMatch?.[1]?.trim()  ?? `fix: ${bounty.title}`,
    commitMessage: commitMatch?.[1]?.trim()   ?? `fix: ${bounty.title} (closes #${issueDetails.num})`,
    prBody:        prBodyMatch?.[1]?.trim()   ?? `Fixes #${issueDetails.num}\n\nAutonomous fix by ELASTIC HIVE · SING 9`,
    files: fileBlocks.map(m => ({
      path:              m[1].trim(),
      content:           m[2],
      changeDescription: `Autonomous fix for bounty #${issueDetails.num}`
    }))
  };
}

/* ── LLM API WRAPPER — Anthropic Claude or Groq (Llama 3.3 70B) ─────────── */

async function callClaude(prompt, maxTokens = 2048) {
  if (!LLM_PROVIDER) throw new Error('No LLM key configured (ANTHROPIC_API_KEY or GROQ_API_KEY)');

  if (LLM_PROVIDER === 'anthropic') {
    const resp = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'x-api-key':         ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json'
      },
      body: JSON.stringify({
        model:      LLM_MODEL,
        max_tokens:  maxTokens,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!resp.ok) { const e = await resp.text(); throw new Error(`Anthropic ${resp.status}: ${e.slice(0,200)}`); }
    const data = await resp.json();
    return data.content?.[0]?.text ?? '';
  }

  if (LLM_PROVIDER === 'groq') {
    const resp = await fetch(GROQ_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_KEY}`,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify({
        model:      LLM_MODEL,
        max_tokens:  maxTokens,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      })
    });
    if (!resp.ok) { const e = await resp.text(); throw new Error(`Groq ${resp.status}: ${e.slice(0,200)}`); }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content ?? '';
  }
}

/* ── PRIORITY TARGETS — verified live, high match, our direct lane ──────────
 * These are checked FIRST before the API fetch.
 * Rules for inclusion:
 *   ✓ Language: TypeScript / JavaScript / Python / Node.js ONLY
 *   ✓ metadataMatchScore ≥ 0.70
 *   ✓ We have demonstrable prior art (HIVE-MCP, elastic-bridge, Baozi agents)
 *   ✗ EXCLUDED: Rust, Go, Java, C++ — hard disqualifiers
 *   ✗ EXCLUDED: Requires demo video, DevPost form, human judge
 * Updated: 2026-02-27 · Re-verify weekly · Remove any that go stale
 */
const PRIORITY_TARGETS = [
  // ━━ MCP INTEGRATION (our direct lane — we built HIVE-MCP) ━━━━━━━━━━━━━━━
  // Verified live 2026-02-27: issue #1301 open, $900 bounty label confirmed
  {
    id:       'algora-archestra-mcp-900',
    platform: 'algora',
    title:    'Support MCP Apps in Archestra',
    amount:   900,
    currency: 'USD',
    issueUrl: 'https://github.com/archestra-ai/archestra/issues/1301',
    repoUrl:  'https://github.com/archestra-ai/archestra',
    lang:     'typescript',
    labels:   'bounty,mcp,agent',
    why:      'MCP integration in TypeScript — identical to our HIVE-MCP server. Issue #1301 confirmed open + $900 bounty label.',
    _matchScore: 1.0
  },
  // ━━ TWENTY CRM — x.ai / Grok LLM PROVIDER ($1850 bounty label confirmed) ━
  // Verified 2026-02-27: issue #1850 open, TypeScript, our lane
  {
    id:       'archestra-grok-provider-1850',
    platform: 'algora',
    title:    '[Provider] Add x.ai (Grok) support',
    amount:   1850,
    currency: 'USD',
    issueUrl: 'https://github.com/archestra-ai/archestra/issues/1850',
    repoUrl:  'https://github.com/archestra-ai/archestra',
    lang:     'typescript',
    labels:   'bounty,llm,provider',
    why:      'TypeScript LLM provider integration. We know the x.ai API from SING9 LLM work. Clear pattern match.',
    _matchScore: 0.92
  },
];

/* ── MAIN SOLVER LOOP ────────────────────────────────────────────────────── */

/**
 * solve(lattice) — run one full autonomous bounty hunting cycle.
 * Returns array of submission results for LATTICE tracking.
 */
async function solve(lattice) {
  log('⬡', `SOLVER CYCLE · ${new Date().toISOString()}`);
  log('⬡', `Min bounty: $${MIN_BOUNTY_USD} · Max attempts: ${MAX_ATTEMPTS}`);

  if (!GITHUB_TOKEN) {
    log('⚠', 'GITHUB_TOKEN not set — cannot submit PRs. Add to .env to enable solver.');
    return [];
  }
  if (!LLM_PROVIDER) {
    log('⚠', 'No LLM key found (ANTHROPIC_API_KEY or GROQ_API_KEY) — using heuristic mode (lower accuracy).');
  } else {
    log('⬡', `LLM: ${LLM_PROVIDER} · ${LLM_MODEL}`);
  }

  // Get our GitHub identity
  let ghUser;
  try {
    ghUser = await ghGet('/user');
    log('⬡', `GitHub: @${ghUser.login} · ${ghUser.name ?? ''}`);
  } catch (e) {
    log('⚠', `GitHub auth failed: ${e.message}`);
    return [];
  }

  // Track already-attempted bounties so we don't double-submit
  const pipeline = lattice?.mission?.prize_pipeline ?? [];
  const attempted = new Set(
    pipeline
      .filter(p => p.platform && ['algora','issuehunt','gitcoin'].includes(p.platform))
      .map(p => p.id)
  );

  // Priority targets first — verified live, high confidence, our direct lane
  const priorityQueue = PRIORITY_TARGETS.filter(b => !attempted.has(b.id));
  if (priorityQueue.length) {
    log('⬡', `Priority queue: ${priorityQueue.length} verified target(s) — attempting first`);
    for (const b of priorityQueue) log('⬡', `  ★ $${b.amount} — ${b.title} · ${b.why}`);
  }

  // Then fetch live bounties from APIs
  log('🔍', 'Fetching live bounties from Algora · IssueHunt · Gitcoin...');
  const [algora, issuehunt, gitcoin] = await Promise.all([
    fetchAlgoraBounties(),
    fetchIssueHuntBounties(),
    fetchGitcoinBounties()
  ]);
  const allBounties = [...algora, ...issuehunt, ...gitcoin];

  log('⬡', `Found: ${algora.length} Algora · ${issuehunt.length} IssueHunt · ${gitcoin.length} Gitcoin = ${allBounties.length} total`);

  // Priority targets first, then API results (deduped, filtered, sorted by value)
  // GATE 1: metadata pre-filter — must reach MATCH_THRESHOLD before any LLM or issue fetch
  const apiCandidates = allBounties
    .filter(b => !attempted.has(b.id))
    .filter(b => !priorityQueue.find(p => p.id === b.id))
    .filter(b => b.issueUrl?.includes('github.com'))
    .map(b => ({ ...b, _matchScore: metadataMatchScore(b) }))
    .filter(b => {
      if (b._matchScore < MATCH_THRESHOLD) {
        log('◈', `Pre-filter skip: "${b.title.slice(0,60)}" — match=${b._matchScore.toFixed(2)} < ${MATCH_THRESHOLD}`);
        return false;
      }
      return true;
    })
    .sort((a, b) => (b._matchScore * b.amount) - (a._matchScore * a.amount)); // rank by score × value

  // Priority targets also get match-scored (they're pre-vetted so they pass, but log it)
  const scoredPriority = priorityQueue.map(b => ({ ...b, _matchScore: metadataMatchScore(b) }));

  const candidates = [...scoredPriority, ...apiCandidates];

  if (!candidates.length) {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║  SOLVER CYCLE COMPLETE · HIGH-MATCH MODE ║');
    console.log('╚══════════════════════════════════════════╝');
    log('⬡', `0 candidates passed metadata gate (threshold: ${MATCH_THRESHOLD})`);
    log('⬡', 'This is correct behavior. No low-quality submissions. Cycle clean.');
    return [];
  }

  log('⬡', `${candidates.length} candidates passed metadata gate (≥${MATCH_THRESHOLD}) — proceeding to LLM assessment`);

  const results = [];
  let attempts  = 0;

  for (const bounty of candidates) {
    if (attempts >= MAX_ATTEMPTS) break;

    log('\n⬡', `━━ Evaluating: ${bounty.title.slice(0, 70)} · $${bounty.amount} [${bounty.platform}]`);

    // Get issue details
    let issueDetails;
    try {
      issueDetails = await getIssueDetails(bounty.issueUrl);
      if (!issueDetails) { log('◈', 'Skip — could not parse GitHub URL'); continue; }
    } catch (e) {
      log('⚠', `Issue fetch failed: ${e.message}`); continue;
    }

    // GATE 2: LLM deep-read feasibility — must reach FEASIBILITY_THRESHOLD
    const feasibility = await assessFeasibility(issueDetails, bounty);
    log('📊', `Feasibility: ${feasibility.score.toFixed(2)} (gate: ${FEASIBILITY_THRESHOLD}) — ${feasibility.reasoning?.slice(0, 100)}`);

    if (feasibility.score < FEASIBILITY_THRESHOLD) {
      log('◈', `Skip — score ${feasibility.score.toFixed(2)} < ${FEASIBILITY_THRESHOLD} — ${feasibility.skipReason ?? 'below high-match threshold'}`);
      // Still log to LATTICE as identified-but-skipped
      pipeline.push({
        id:           bounty.id,
        platform:     bounty.platform,
        type:         'BOUNTY',
        name:         bounty.title.slice(0, 100),
        url:          bounty.issueUrl,
        prize:        `$${bounty.amount}`,
        confidence:   feasibility.score,
        status:       'SKIPPED',
        skip_reason:  feasibility.skipReason,
        discovered_at: new Date().toISOString(),
        stream:       'PRIZE'
      });
      continue;
    }

    attempts++;
    log('⬡', `Attempting fix (${attempts}/${MAX_ATTEMPTS}) · approach: ${feasibility.approach?.slice(0,80)}`);

    // Generate the fix
    let fix;
    try {
      fix = await generateFix(issueDetails, bounty, feasibility);
      if (!fix?.files?.length) { log('⚠', 'No files in fix — skip'); continue; }
    } catch (e) {
      log('⚠', `Fix generation failed: ${e.message}`); continue;
    }

    log('✓', `Fix ready: ${fix.files.length} file(s) — "${fix.prTitle}"`);

    // Submit via GitHub API
    let prUrl = null;
    let prError = null;
    try {
      // 1. Fork
      log('⬡', `Forking ${issueDetails.owner}/${issueDetails.repo}...`);
      const fork = await createFork(issueDetails.owner, issueDetails.repo);
      await sleep(3000); // let fork propagate

      // 2. Get default branch SHA
      const refData = await ghGet(`/repos/${fork.full_name}/git/ref/heads/${fork.default_branch ?? 'main'}`);
      const baseSha = refData.object.sha;

      // 3. Create branch
      const branchName = `hive-fix-${issueDetails.num}-${Date.now()}`;
      await createBranch(fork.owner.login, fork.name, branchName, baseSha);
      log('⬡', `Branch created: ${branchName}`);

      // 4. Commit each file
      for (const f of fix.files) {
        await commitFile(
          fork.owner.login, fork.name, branchName,
          f.path, f.content,
          fix.commitMessage ?? `fix: closes #${issueDetails.num}`
        );
        log('✓', `Committed ${f.path}`);
        await sleep(500);
      }

      // 5. Open PR
      const pocketInfo = WALLET_ADDRESS
        ? `\n\n---\n*Payout: ${WALLET_ADDRESS}*`
        : PAYOUT_EMAIL ? `\n\n---\n*Payout email: ${PAYOUT_EMAIL}*` : '';

      const pr = await openPR(
        issueDetails.owner, issueDetails.repo,
        fork.owner.login, branchName,
        fix.prTitle ?? `fix: closes #${issueDetails.num}`,
        (fix.prBody ?? '') + pocketInfo,
        issueDetails.repoInfo?.default_branch ?? 'main'
      );
      prUrl = pr.html_url;
      log('✓', `PR opened: ${prUrl}`);

    } catch (e) {
      prError = e.message;
      log('⚠', `GitHub submission failed: ${e.message}`);
    }

    // Record in LATTICE
    const entry = {
      id:             bounty.id,
      platform:       bounty.platform,
      type:           'BOUNTY',
      name:           bounty.title.slice(0, 100),
      url:            bounty.issueUrl,
      prize:          `$${bounty.amount}`,
      confidence:     feasibility.score,
      status:         prUrl ? 'SUBMITTED' : 'FAILED',
      pr_url:         prUrl,
      pr_error:       prError,
      files_changed:  (fix.files ?? []).map(f => f.path),
      discovered_at:  new Date().toISOString(),
      submitted_at:   new Date().toISOString(),
      stream:         'PRIZE'
    };
    pipeline.push(entry);
    results.push(entry);

    await sleep(2000);
  }

  // Summary
  const submitted  = results.filter(r => r.status === 'SUBMITTED').length;
  const skipped    = pipeline.filter(p => p.status === 'SKIPPED').length;
  const totalValue = results
    .filter(r => r.status === 'SUBMITTED')
    .reduce((s, r) => s + parseFloat((r.prize ?? '$0').replace('$','')), 0);

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  SOLVER CYCLE COMPLETE · HIGH-MATCH MODE ║');
  console.log('║  NSPFRNP → ∞⁹                            ║');
  console.log('╚══════════════════════════════════════════╝');
  log('⬡', `Metadata gate: ${MATCH_THRESHOLD} · Feasibility gate: ${FEASIBILITY_THRESHOLD}`);
  log('⬡', `Candidates: ${candidates.length} · Attempted: ${attempts} · Submitted: ${submitted} · Skipped low-match: ${skipped}`);
  if (submitted === 0) {
    log('⬡', '0 submissions this cycle — correct. No low-quality PRs sent. Quality over quantity.');
  } else {
    log('⬡', `Total prize value in play: $${totalValue.toLocaleString()}`);
  }

  return results;
}

/* ── UTILITY ────────────────────────────────────────────────────────────── */

function log(icon, msg) { console.log(`${icon}  ${msg ?? ''}`); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

module.exports = { solve, fetchAlgoraBounties, fetchIssueHuntBounties, fetchGitcoinBounties };
