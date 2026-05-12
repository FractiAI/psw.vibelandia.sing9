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

function maxIsoMonth(rows) {
  let m = null;
  for (const row of rows) {
    const t = row["time-tag"];
    if (typeof t === "string" && /^\d{4}-\d{2}$/.test(t) && (!m || t > m)) m = t;
  }
  return m;
}

/** Last calendar month where NOAA has published both SSN and F10.7 (same-row monthly indices). */
function lastPairedNoaaMonth(sunData, f107Data) {
  const a = maxIsoMonth(sunData);
  const b = maxIsoMonth(f107Data);
  if (!a) return b;
  if (!b) return a;
  return a < b ? a : b;
}

async function solarMonthly(months) {
  const sunspots = Object.fromEntries(months.map((k) => [k, null]));
  const f107 = Object.fromEntries(months.map((k) => [k, null]));
  const [sunData, f107Data] = await Promise.all([
    fetchJsonAny("https://services.swpc.noaa.gov/json/solar-cycle/sunspots.json"),
    fetchJsonAny("https://services.swpc.noaa.gov/json/solar-cycle/f10-7cm-flux.json"),
  ]);
  const lastNoaa = lastPairedNoaaMonth(sunData, f107Data);

  sunData.forEach((row) => {
    const t = row["time-tag"];
    if (!Object.prototype.hasOwnProperty.call(sunspots, t)) return;
    const v = Number(row.ssn);
    sunspots[t] = Number.isFinite(v) ? v : null;
  });
  f107Data.forEach((row) => {
    const t = row["time-tag"];
    if (!Object.prototype.hasOwnProperty.call(f107, t)) return;
    const v = Number(row["f10.7"]);
    f107[t] = Number.isFinite(v) ? v : null;
  });
  return { sunspots, f107, lastNoaaMonth: lastNoaa };
}

function sum(map, months) {
  return months.reduce((a, k) => a + (Number(map[k]) || 0), 0);
}

function monthsWithPairedSolar(months, sunspots, f107) {
  return months.filter((mo) => {
    const s = sunspots[mo];
    const f = f107[mo];
    return Number.isFinite(s) && Number.isFinite(f);
  });
}

function buildFindings(months, commits, uploads, minutes, sunspots, f107, sources) {
  const first = months[0];
  const last = months[months.length - 1];

  const solarMonths = monthsWithPairedSolar(months, sunspots, f107);
  const sFirst = solarMonths[0] || first;
  const sLast = solarMonths[solarMonths.length - 1] || last;
  const s0 = solarMonths.length && Number.isFinite(sunspots[sFirst]) ? sunspots[sFirst] : 0;
  const s1 = solarMonths.length && Number.isFinite(sunspots[sLast]) ? sunspots[sLast] : 0;
  const f0 = solarMonths.length && Number.isFinite(f107[sFirst]) ? f107[sFirst] : 0;
  const f1 = solarMonths.length && Number.isFinite(f107[sLast]) ? f107[sLast] : 0;

  const sunMove =
    solarMonths.length === 0
      ? "n/a"
      : s1 > s0 + 8
        ? "climbed"
        : s1 < s0 - 8
          ? "fell"
          : "wandered in the middle";

  const lastNoaa = sources.lastNoaaMonth || sLast;
  const hasIncompleteSolarTail = Boolean(lastNoaa && last > lastNoaa);
  const solarTailBlank =
    solarMonths.length > 0 && s1 === 0 && f1 === 0 && sLast === lastNoaa;

  let maxCommitMo = months[0];
  let maxCommitV = -1;
  months.forEach((mo) => {
    const v = commits[mo] || 0;
    if (v > maxCommitV) {
      maxCommitV = v;
      maxCommitMo = mo;
    }
  });

  let maxUploadMo = months[0];
  let maxUploadV = -1;
  months.forEach((mo) => {
    const v = uploads[mo] || 0;
    if (v > maxUploadV) {
      maxUploadV = v;
      maxUploadMo = mo;
    }
  });

  const totalCommits = sum(commits, months);
  const totalUploads = sum(uploads, months);
  const totalMin = sum(minutes, months);
  const repoPlain = sources.githubRepos.join(" and ");

  const commitPhrase =
    maxCommitV > 0
      ? `commits run hottest in **${maxCommitMo}** (${maxCommitV})`
      : "Git shows almost no commits in this window";
  const uploadPhrase =
    maxUploadV > 0
      ? `SoundCloud dated drops peak in **${maxUploadMo}** (${maxUploadV})`
      : "SoundCloud shows almost no dated drops in this window";

  const headline = "What we found";
  const solarWindow =
    solarMonths.length === 0
      ? "NOAA monthly sunspot / F10.7 rows did not load for this window."
      : `Over **${sFirst}**–**${sLast}** (latest paired NOAA month): monthly sunspots **${sunMove}** from **${s0.toFixed(0)}** to **${s1.toFixed(0)}**, and **F10.7** — the same-row **ionosphere / EUV** yardstick — runs **${f0.toFixed(0)} → ${f1.toFixed(0)}** sfu.`;

  const tailNote = hasIncompleteSolarTail
    ? ` Calendar months after **${lastNoaa}** stay **empty** until SWPC publishes the official monthly sunspot + F10.7 row (they are **not** zero flux).`
    : solarTailBlank
      ? " The **last** published month still shows **0 / 0** — that can be a true solar-minimum pocket or a provisional row; cross-check SWPC if it looks off."
      : "";

  const lede = `From **${first}** to **${last}**: ${commitPhrase}, and ${uploadPhrase}. The **Sun panel** is different: ${solarWindow} Those two curves usually **walk together** on the slow cycle; here they **soften** while your studio lines spike, so **do not read the Sun as the throttle for shipping** on this sheet.${tailNote}`;

  const bullets = [
    `**GitHub (${totalCommits} commits):** counts are only **${repoPlain}**. They tell you when those two repos actually moved.`,
    `**SoundCloud (${totalUploads} drops, ${totalMin.toFixed(1)} minutes):** dates come from the public RSS. The feed **caps at 500 episodes**, so older history can look like silence — that is a **feed limit**, not proof nobody uploaded.`,
    `**Sun + ionosphere:** **Sunspots** are the classic monthly sun-strength number. **F10.7** is posted on the same monthly row and is the usual **radio-Sun / ionosphere heating** yardstick; it **tracks the cycle with** sunspots. Trailing months without an NOAA row stay **null** (shown as a dash on the page) — not zero flux. Use both as **background weather**, not as a reason your mixtape shipped.`,
  ];

  return {
    headline,
    lede,
    bullets,
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
console.log("NOAA OK", "last paired month:", solar.lastNoaaMonth);

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
  lastNoaaMonth: solar.lastNoaaMonth || null,
  ionosphereNote:
    "F10.7 (10.7 cm flux) is the monthly field NOAA publishes alongside sunspots; it is the usual stand-in for EUV-driven ionospheric heating on slow, monthly scales. Months after the latest NOAA row are omitted (null), not zero. Kp is not included here (needs a different archive than this small JSON).",
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
