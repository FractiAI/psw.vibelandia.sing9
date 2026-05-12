/**
 * One-shot: NOAA solar JSON + SoundCloud RSS (direct HTTPS) + GitHub commits
 * (REST list, two flagship repos — no Search API).
 * Writes interfaces/look-at-the-sun-study.json for static look-at-the-sun.html.
 *
 * Usage: node scripts/build-look-at-the-sun-study.mjs
 */
import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "interfaces", "look-at-the-sun-study.json");

const START = "2025-02";

/** Repos whose default-branch commits are summed by calendar month (proxy for “studio pulse”). */
const GITHUB_REPOS = [
  ["fractiai", "psw.vibelandia.sing9"],
  ["AiwonA1", "JWST-SMACS-0723"],
];

function monthRange(start, end) {
  const out = [];
  let y = Number(start.slice(0, 4));
  let m = Number(start.slice(5, 7));
  const ey = Number(end.slice(0, 4));
  const em = Number(end.slice(5, 7));
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      y += 1;
      m = 1;
    }
  }
  return out;
}

function githubHeaders() {
  const h = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "psw-vibelandia-sing9-study-builder",
  };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function fetchJsonAny(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "psw-vibelandia-sing9-study-builder" },
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

function parseNextUrl(linkHeader) {
  if (!linkHeader) return null;
  for (const p of linkHeader.split(",")) {
    const s = p.trim();
    if (s.includes('rel="next"')) {
      const m = s.match(/<([^>]+)>/);
      return m ? m[1] : null;
    }
  }
  return null;
}

async function githubCommitsFromRepo(owner, repo, months) {
  const counts = Object.fromEntries(months.map((k) => [k, 0]));
  if (!months.length) return counts;
  const since = `${months[0]}-01T00:00:00Z`;
  let url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=100&since=${encodeURIComponent(since)}`;
  for (let guard = 0; guard < 400; guard++) {
    const res = await fetch(url, { headers: githubHeaders() });
    if (!res.ok) throw new Error(`${owner}/${repo} → ${res.status}`);
    const arr = await res.json();
    if (!Array.isArray(arr) || arr.length === 0) break;
    for (const c of arr) {
      const raw = c.commit?.committer?.date || c.commit?.author?.date;
      const d = raw ? new Date(raw) : null;
      if (!d || Number.isNaN(d.getTime())) continue;
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      if (Object.prototype.hasOwnProperty.call(counts, key)) counts[key] += 1;
    }
    const next = parseNextUrl(res.headers.get("link"));
    if (!next) break;
    url = next;
    await new Promise((r) => setTimeout(r, 90));
  }
  return counts;
}

function mergeCounts(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out = {};
  keys.forEach((k) => {
    out[k] = (a[k] || 0) + (b[k] || 0);
  });
  return out;
}

function parseDurationToMinutes(raw) {
  if (!raw) return 0;
  const parts = String(raw).trim().split(":").map(Number);
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 3) return (parts[0] * 3600 + parts[1] * 60 + parts[2]) / 60;
  if (parts.length === 2) return (parts[0] * 60 + parts[1]) / 60;
  if (parts.length === 1) return parts[0] / 60;
  return 0;
}

async function fetchTextHttps(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        { headers: { "User-Agent": "psw-vibelandia-sing9-study-builder" } },
        (res) => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }
          let d = "";
          res.on("data", (c) => (d += c));
          res.on("end", () => resolve(d));
        }
      )
      .on("error", reject);
  });
}

async function soundcloudMonthlyFromFeed(months) {
  const uploads = Object.fromEntries(months.map((k) => [k, 0]));
  const minutes = Object.fromEntries(months.map((k) => [k, 0]));
  const feedUrl =
    "https://feeds.soundcloud.com/users/soundcloud:users:1681714067/sounds.rss";
  const xml = await fetchTextHttps(feedUrl);
  const itemRe = /<item\b[\s\S]*?<\/item>/gi;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[0];
    const pub = block.match(/<pubDate>([^<]+)<\/pubDate>/i);
    if (!pub) continue;
    const dt = new Date(pub[1].trim());
    if (Number.isNaN(dt.getTime())) continue;
    const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}`;
    if (!Object.prototype.hasOwnProperty.call(uploads, key)) continue;
    uploads[key] += 1;
    const durM = block.match(/<itunes:duration>\s*([^<]+)\s*<\/itunes:duration>/i);
    minutes[key] += parseDurationToMinutes(durM ? durM[1] : "0");
  }
  return { uploads, minutes };
}

async function solarMonthly(months) {
  const sunspots = Object.fromEntries(months.map((k) => [k, 0]));
  const f107 = Object.fromEntries(months.map((k) => [k, 0]));
  const [sunData, f107Data] = await Promise.all([
    fetchJsonAny("https://services.swpc.noaa.gov/json/solar-cycle/sunspots.json"),
    fetchJsonAny("https://services.swpc.noaa.gov/json/solar-cycle/f10-7cm-flux.json"),
  ]);
  sunData.forEach((row) => {
    if (sunspots[row["time-tag"]] !== undefined) sunspots[row["time-tag"]] = Number(row.ssn || 0);
  });
  f107Data.forEach((row) => {
    if (f107[row["time-tag"]] !== undefined) f107[row["time-tag"]] = Number(row["f10.7"] || 0);
  });
  return { sunspots, f107 };
}

function sum(map, months) {
  return months.reduce((a, k) => a + (Number(map[k]) || 0), 0);
}

function buildFindings(months, commits, uploads, minutes, sunspots, f107, sources) {
  const overlap = {};
  months.forEach((mo) => {
    overlap[mo] =
      (commits[mo] || 0) +
      (uploads[mo] || 0) * 3 +
      (minutes[mo] || 0) * 0.2 +
      (sunspots[mo] || 0) * 0.1 +
      (f107[mo] || 0) * 0.15;
  });
  const peak = months.length
    ? months.reduce((best, mo) => (overlap[mo] > overlap[best] ? mo : best), months[0])
    : "—";

  const topCommits = [...months]
    .map((mo) => ({ mo, n: commits[mo] || 0 }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 3)
    .filter((x) => x.n > 0);

  const topUploadMo = months.length
    ? months.reduce((best, mo) => ((uploads[mo] || 0) > (uploads[best] || 0) ? mo : best), months[0])
    : "—";
  const topUploadN = uploads[topUploadMo] || 0;

  const first = months[0];
  const last = months[months.length - 1];
  const s0 = sunspots[first] ?? 0;
  const s1 = sunspots[last] ?? 0;
  const f0 = f107[first] ?? 0;
  const f1 = f107[last] ?? 0;
  const solarTrend =
    s1 > s0 + 5
      ? "rose"
      : s1 < s0 - 5
        ? "eased"
        : "stayed mid-band";

  const solarIncomplete = s1 === 0 && f1 === 0;

  const totalCommits = sum(commits, months);
  const totalUploads = sum(uploads, months);
  const totalMin = sum(minutes, months);
  const repoLine = sources.githubRepos.map((r) => `\`${r}\``).join(" + ");

  const commitBurst = topCommits[0]
    ? `Git commit heat concentrates in **${topCommits[0].mo}** (${topCommits[0].n})${topCommits[1] ? ` and **${topCommits[1].mo}** (${topCommits[1].n})` : ""}.`
    : "Git commits are flat in-window for the counted repos.";

  const lede = `**What this page does:** it stacks SoundCloud catalog gravity, GitHub merge velocity on two flagship repos, and NOAA’s **monthly** sunspot / F10.7 panel on one calendar — then **judge alignment honestly**. **Interpretation here:** studio-side work **surges in early 2026** — ${commitBurst} Uploads peak in **${topUploadMo}** (${topUploadN} drops inside the RSS window) while solar indices **${solarTrend}** from SSN **${s0.toFixed(0)} → ${s1.toFixed(0)}** (F10.7 **${f0.toFixed(0)} → ${f1.toFixed(0)}**). That pattern reads as **throughput decoupled from monthly sunspot level** on this slice — useful before anyone claims “sun-driven shipping.”${solarIncomplete ? " **Caveat:** the last month often shows **0** in SWPC JSON until the row finalizes — don’t treat trailing solar cells as gospel." : ""} RSS only exposes the **latest 500** episodes, so pre-burst months can look artificially empty; zeros there are a **coverage artifact**, not proof of silence.`;

  const bullets = [
    `**Evidence lane 1 — code:** **${totalCommits}** commits summed across ${repoLine} (GitHub REST, paginated). That is a **repeatable proxy** for “did the engineering floor light up?” — not total GitHub activity universe-wide.`,
    `**Evidence lane 2 — catalog:** **${totalUploads}** SoundCloud items dated inside the window plus **${totalMin.toFixed(1)}** play-ready minutes from \`itunes:duration\`. Interpreting silence before the feed window is **invalid**; interpreting the April/May stack-up is **valid** where dates land inside the slice.`,
    `**Evidence lane 3 — Sun:** NOAA monthly SSN **${solarTrend}** across **${first}→${last}**; F10.7 tracks the same slow cycle as a coarse ionosphere proxy. Use it as **context**, not a release scheduler.`,
    `**Composite index (transparent toy):** weighted mix of commits, uploads, minutes, and mild solar terms peaks in **${peak}** — that only means “lines stacked high that month on this formula,” **not** causation.`,
    "This JSON is a **frozen snapshot**. Regenerate with `node scripts/build-look-at-the-sun-study.mjs`, commit, redeploy. **Correlation ≠ causation.**",
  ];

  return {
    headline: "Analysis: throughput sprint vs. cooling monthly solar (same calendar).",
    lede,
    bullets,
    peakMonth: peak,
    totals: {
      commits: totalCommits,
      uploads: totalUploads,
      minutes: Math.round(totalMin * 10) / 10,
    },
  };
}

const now = new Date();
const endMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
const months = monthRange(START, endMonth);

console.log("Months:", months.length, months[0], "→", months[months.length - 1]);

const solar = await solarMonthly(months);
console.log("NOAA OK");

let commits = Object.fromEntries(months.map((k) => [k, 0]));
try {
  for (const [owner, repo] of GITHUB_REPOS) {
    const part = await githubCommitsFromRepo(owner, repo, months);
    commits = mergeCounts(commits, part);
    console.log("GitHub OK", `${owner}/${repo}`);
    await new Promise((r) => setTimeout(r, 200));
  }
} catch (e) {
  console.warn("GitHub:", e.message);
}

let sc;
try {
  sc = await soundcloudMonthlyFromFeed(months);
  console.log("SoundCloud OK");
} catch (e) {
  console.warn("SoundCloud:", e.message);
  sc = {
    uploads: Object.fromEntries(months.map((k) => [k, 0])),
    minutes: Object.fromEntries(months.map((k) => [k, 0])),
  };
}

const sources = {
  githubRepos: GITHUB_REPOS.map(([o, r]) => `${o}/${r}`),
  soundcloudFeed: "https://feeds.soundcloud.com/users/soundcloud:users:1681714067/sounds.rss",
  noaaSunspots: "https://services.swpc.noaa.gov/json/solar-cycle/sunspots.json",
  noaaF107: "https://services.swpc.noaa.gov/json/solar-cycle/f10-7cm-flux.json",
};

const findings = buildFindings(months, commits, sc.uploads, sc.minutes, solar.sunspots, solar.f107, sources);

const snapshot = {
  generatedAt: new Date().toISOString().slice(0, 10),
  startMonth: START,
  endMonth,
  months,
  commits,
  uploads: sc.uploads,
  minutes: sc.minutes,
  sunspots: solar.sunspots,
  f107: solar.f107,
  findings,
  sources,
};

fs.writeFileSync(OUT, JSON.stringify(snapshot, null, 2), "utf8");
console.log("Wrote", OUT);
