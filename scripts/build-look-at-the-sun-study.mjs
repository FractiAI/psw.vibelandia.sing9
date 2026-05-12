/**
 * NOAA solar (daily SSN + monthly F10.7 expanded to days) + SoundCloud RSS + GitHub commits,
 * aligned on UTC weeks (Monday start). Writes interfaces/look-at-the-sun-study.json.
 *
 * Usage: node scripts/build-look-at-the-sun-study.mjs
 */
import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "interfaces", "look-at-the-sun-study.json");

/** First calendar month included (UTC); weeks begin on the Monday of/on-before the 1st. */
const START_MONTH = "2025-02";

const GITHUB_REPOS = [
  ["fractiai", "psw.vibelandia.sing9"],
  ["AiwonA1", "JWST-SMACS-0723"],
  ["AiwonA1", "L4-L7-Fractal-Self-Awareness-Intelligence-Router"],
  ["AiwonA1", "fractiverse-router"],
  ["AiwonA1", "FractiAgent-1.0"],
  ["AiwonA1", "FractiData-1.0"],
  ["AiwonA1", "ParadiseWorld-1.0-AI-Game"],
  ["AiwonA1", "EnterpriseWorld-7DAI-Superintelligence"],
  ["AiwonA1", "Omniverse-for-Digital-Assistants-and-Agents"],
  ["AiwonA1", "HydrogenHolographPilot"],
  ["AiwonA1", "FractalHydrogenHolography-Validation"],
  ["AiwonA1", "Syntheverse-Hydrogen-Holographic-RAG"],
  ["AiwonA1", "Syntheverse-"],
];

function parseMonthStartUtc(isoMonth) {
  const [y, mo] = isoMonth.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, 1));
}

function utcDateOnly(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Monday 00:00 UTC of the week containing `d` (Monday is start of week). */
function utcMondayOfWeek(d) {
  const x = utcDateOnly(d);
  const dow = x.getUTCDay(); // 0 Sun … 6 Sat
  const daysFromMon = (dow + 6) % 7;
  x.setUTCDate(x.getUTCDate() - daysFromMon);
  return x;
}

function addUtcDays(d, n) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

function toYyyyMm(d) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function toYyyyMmDd(d) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** Sorted Monday keys `YYYY-MM-DD` from chart start through end (inclusive). */
function enumerateWeekPeriods(startMonth, endExclusiveUtc) {
  const start0 = parseMonthStartUtc(startMonth);
  let mon = utcMondayOfWeek(start0);
  const endDay = utcDateOnly(endExclusiveUtc);
  const out = [];
  while (mon <= endDay) {
    out.push(toYyyyMmDd(mon));
    mon = addUtcDays(mon, 7);
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
    headers: { "User-Agent": "psw-vibelandia.sing9-study-builder" },
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

function monthBefore(isoMonth) {
  const [y, mo] = isoMonth.split("-").map(Number);
  let yy = y;
  let mm = mo - 1;
  if (mm < 1) {
    yy -= 1;
    mm = 12;
  }
  return `${yy}-${String(mm).padStart(2, "0")}`;
}

function monthStartIso(isoMonth) {
  return `${isoMonth}-01T00:00:00Z`;
}

async function githubCommitsFromRepo(owner, repo, periodSet, sinceIso) {
  const counts = Object.fromEntries([...periodSet].map((k) => [k, 0]));
  if (!periodSet.size) return counts;
  let url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=100&since=${encodeURIComponent(sinceIso)}`;
  for (let guard = 0; guard < 400; guard++) {
    const res = await fetch(url, { headers: githubHeaders() });
    if (res.status === 409 || res.status === 404) return counts;
    if (!res.ok) throw new Error(`${owner}/${repo} → ${res.status}`);
    const arr = await res.json();
    if (!Array.isArray(arr) || arr.length === 0) break;
    for (const c of arr) {
      const raw = c.commit?.author?.date || c.commit?.committer?.date;
      const d = raw ? new Date(raw) : null;
      if (!d || Number.isNaN(d.getTime())) continue;
      const key = toYyyyMmDd(utcMondayOfWeek(d));
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
        { headers: { "User-Agent": "psw-vibelandia.sing9-study-builder" } },
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

async function soundcloudWeeklyFromFeed(periodSet) {
  const uploads = Object.fromEntries([...periodSet].map((k) => [k, 0]));
  const minutes = Object.fromEntries([...periodSet].map((k) => [k, 0]));
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
    const key = toYyyyMmDd(utcMondayOfWeek(dt));
    if (!Object.prototype.hasOwnProperty.call(uploads, key)) continue;
    uploads[key] += 1;
    const durM = block.match(/<itunes:duration>\s*([^<]+)\s*<\/itunes:duration>/i);
    minutes[key] += parseDurationToMinutes(durM ? durM[1] : "0");
  }
  return { uploads, minutes };
}

function maxIsoMonth(rows) {
  let mx = null;
  for (const row of rows) {
    const t = row["time-tag"];
    if (typeof t === "string" && /^\d{4}-\d{2}$/.test(t) && (!mx || t > mx)) mx = t;
  }
  return mx;
}

function lastPairedNoaaMonth(sunData, f107Data) {
  const a = maxIsoMonth(sunData);
  const b = maxIsoMonth(f107Data);
  if (!a) return b;
  if (!b) return a;
  return a < b ? a : b;
}

/** Monthly F10.7 from solar-cycle JSON (same source as before). */
async function monthlyF107Map() {
  const rows = await fetchJsonAny(
    "https://services.swpc.noaa.gov/json/solar-cycle/f10-7cm-flux.json"
  );
  const map = {};
  rows.forEach((row) => {
    const t = row["time-tag"];
    if (typeof t !== "string" || !/^\d{4}-\d{2}$/.test(t)) return;
    const v = Number(row["f10.7"]);
    map[t] = Number.isFinite(v) ? v : null;
  });
  return map;
}

/** Daily SWPC sunspot number → map `YYYY-MM-DD` (UTC day of Obsdate) → number */
async function dailySsnByDay() {
  const rows = await fetchJsonAny(
    "https://services.swpc.noaa.gov/json/solar-cycle/swpc_observed_ssn.json"
  );
  const byDay = {};
  for (const row of rows) {
    const raw = row.Obsdate;
    if (!raw) continue;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) continue;
    const key = toYyyyMmDd(utcDateOnly(d));
    const v = Number(row.swpc_ssn);
    if (Number.isFinite(v)) byDay[key] = v;
  }
  return byDay;
}

/**
 * For each UTC calendar day in [startDay, endDay], weekly buckets:
 * - sunspots: mean of daily SWPC SSN where present
 * - f107: mean of daily values where each day uses its month’s published F10.7 (null if month unpublished)
 */
function weeklySolarFromDays(periods, monthlyF107, dailySsn, lastNoaaMonth) {
  if (!periods.length) {
    return {
      sunspots: {},
      f107: {},
      lastNoaaMonth,
    };
  }
  const startDay = new Date(`${periods[0]}T12:00:00Z`);
  const endDay = new Date(`${periods[periods.length - 1]}T12:00:00Z`);
  endDay.setUTCDate(endDay.getUTCDate() + 6);

  const acc = {};
  for (const p of periods) {
    acc[p] = { ssn: [], f107: [] };
  }

  for (let d = utcDateOnly(startDay); d <= endDay; d = addUtcDays(d, 1)) {
    const dayKey = toYyyyMmDd(d);
    const monKey = toYyyyMm(d);
    const wk = toYyyyMmDd(utcMondayOfWeek(d));
    if (!acc[wk]) continue;

    if (Object.prototype.hasOwnProperty.call(dailySsn, dayKey)) {
      acc[wk].ssn.push(dailySsn[dayKey]);
    }

    if (lastNoaaMonth && monKey > lastNoaaMonth) {
      /* omit — no published monthly row */
    } else {
      const fv = monthlyF107[monKey];
      if (Number.isFinite(fv)) acc[wk].f107.push(fv);
    }
  }

  const sunspots = {};
  const f107 = {};
  for (const p of periods) {
    const { ssn, f107: fa } = acc[p];
    sunspots[p] = ssn.length ? ssn.reduce((a, b) => a + b, 0) / ssn.length : null;
    f107[p] = fa.length ? fa.reduce((a, b) => a + b, 0) / fa.length : null;
  }

  return { sunspots, f107, lastNoaaMonth };
}

function sum(map, keys) {
  return keys.reduce((a, k) => a + (Number(map[k]) || 0), 0);
}

function periodsWithPairedSolar(periods, sunspots, f107) {
  return periods.filter((p) => {
    const s = sunspots[p];
    const f = f107[p];
    return Number.isFinite(s) && Number.isFinite(f);
  });
}

function buildFindings(periods, commits, uploads, minutes, sunspots, f107, sources) {
  const first = periods[0];
  const last = periods[periods.length - 1];

  const solarP = periodsWithPairedSolar(periods, sunspots, f107);
  const sFirst = solarP[0] || first;
  const sLast = solarP[solarP.length - 1] || last;
  const s0 = solarP.length && Number.isFinite(sunspots[sFirst]) ? sunspots[sFirst] : 0;
  const s1 = solarP.length && Number.isFinite(sunspots[sLast]) ? sunspots[sLast] : 0;
  const f0 = solarP.length && Number.isFinite(f107[sFirst]) ? f107[sFirst] : 0;
  const f1 = solarP.length && Number.isFinite(f107[sLast]) ? f107[sLast] : 0;

  const sunMove =
    solarP.length === 0
      ? "n/a"
      : s1 > s0 + 8
        ? "climbed"
        : s1 < s0 - 8
          ? "fell"
          : "wandered in the middle";

  const lastNoaa = sources.lastNoaaMonth;
  const endCalMonth = toYyyyMm(addUtcDays(new Date(`${last}T12:00:00Z`), 6));
  const hasIncompleteSolarTail = Boolean(lastNoaa && endCalMonth > lastNoaa);

  let maxCommitP = periods[0];
  let maxCommitV = -1;
  periods.forEach((p) => {
    const v = commits[p] || 0;
    if (v > maxCommitV) {
      maxCommitV = v;
      maxCommitP = p;
    }
  });

  let maxUploadP = periods[0];
  let maxUploadV = -1;
  periods.forEach((p) => {
    const v = uploads[p] || 0;
    if (v > maxUploadV) {
      maxUploadV = v;
      maxUploadP = p;
    }
  });

  const totalCommits = sum(commits, periods);
  const totalUploads = sum(uploads, periods);
  const totalMin = sum(minutes, periods);
  const nRepos = sources.githubRepos.length;
  const repoPlain = sources.githubRepos.join(", ");

  const commitPhrase =
    maxCommitV > 0
      ? `commits peak in the week of **${maxCommitP}** (${maxCommitV})`
      : "Git shows almost no commits in this window";
  const uploadPhrase =
    maxUploadV > 0
      ? `SoundCloud dated drops peak in the week of **${maxUploadP}** (${maxUploadV})`
      : "SoundCloud shows almost no dated drops in this window";

  const headline = "What we found";
  const solarWindow =
    solarP.length === 0
      ? "NOAA / SWPC solar rows did not line up for this window."
      : `Across **${sFirst}**–**${sLast}** (UTC weeks with both sunspot and F10.7 coverage): weekly mean sunspot number **${sunMove}** from **${s0.toFixed(1)}** to **${s1.toFixed(1)}**, and weekly mean **F10.7** (from published monthly values) **${f0.toFixed(1)} → ${f1.toFixed(1)}** sfu.`;

  const tailNote = hasIncompleteSolarTail
    ? ` Weeks after the last published NOAA month (**${lastNoaa}**) keep **F10.7** empty until that month exists — not zero flux.`
    : "";

  const lede = `From **${first}** through **${last}** (UTC Monday weeks): ${commitPhrase}, and ${uploadPhrase}. The **Sun / ionosphere panel** uses the same weeks: ${solarWindow} Same caveats as always: **do not read the Sun as the throttle for shipping** on this sheet.${tailNote}`;

  const bullets = [
    `**GitHub (${totalCommits} commits):** summed by UTC week (Monday) across **${nRepos}** public repos: ${repoPlain}.`,
    `**SoundCloud (${totalUploads} drops, ${totalMin.toFixed(1)} minutes):** RSS pubDate bucketed the same way. The feed **caps at 500 episodes**, so older weeks can look empty — a **feed limit**, not proof of silence.`,
    `**Sun:** weekly mean of **SWPC daily** sunspot numbers (\`swpc_observed_ssn.json\`) for days in that week. **Ionosphere (F10.7):** each UTC day carries its calendar month’s published NOAA monthly F10.7; the week is the **mean** of those daily values (constant within a month, so cross-month weeks blend honestly). Trailing weeks without a published month stay **null** (dash) — not zero.`,
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
const endExclusive = addUtcDays(utcDateOnly(now), 1);
const periods = enumerateWeekPeriods(START_MONTH, endExclusive);
const periodSet = new Set(periods);

const sinceMonth = monthBefore(START_MONTH);
const githubSince = monthStartIso(sinceMonth);

console.log("Weeks:", periods.length, periods[0], "→", periods[periods.length - 1]);

const [monthlyF107Rows, dailySsn] = await Promise.all([
  fetchJsonAny("https://services.swpc.noaa.gov/json/solar-cycle/f10-7cm-flux.json"),
  dailySsnByDay(),
]);

const monthlySunRows = await fetchJsonAny(
  "https://services.swpc.noaa.gov/json/solar-cycle/sunspots.json"
);
const lastNoaaMonth = lastPairedNoaaMonth(monthlySunRows, monthlyF107Rows);
console.log("NOAA last paired month:", lastNoaaMonth);

const monthlyF107 = {};
monthlyF107Rows.forEach((row) => {
  const t = row["time-tag"];
  if (typeof t === "string" && /^\d{4}-\d{2}$/.test(t)) {
    const v = Number(row["f10.7"]);
    monthlyF107[t] = Number.isFinite(v) ? v : null;
  }
});

const solar = weeklySolarFromDays(periods, monthlyF107, dailySsn, lastNoaaMonth);
console.log("Solar weekly OK");

let commits = Object.fromEntries(periods.map((k) => [k, 0]));
try {
  for (const [owner, repo] of GITHUB_REPOS) {
    const part = await githubCommitsFromRepo(owner, repo, periodSet, githubSince);
    commits = mergeCounts(commits, part);
    console.log("GitHub OK", `${owner}/${repo}`);
    await new Promise((r) => setTimeout(r, 200));
  }
} catch (e) {
  console.warn("GitHub:", e.message);
}

let sc;
try {
  sc = await soundcloudWeeklyFromFeed(periodSet);
  console.log("SoundCloud OK");
} catch (e) {
  console.warn("SoundCloud:", e.message);
  sc = {
    uploads: Object.fromEntries(periods.map((k) => [k, 0])),
    minutes: Object.fromEntries(periods.map((k) => [k, 0])),
  };
}

const sources = {
  granularity: "week",
  weekAnchor: "UTC Monday 00:00 (period key is that Monday’s date, YYYY-MM-DD)",
  githubRepos: GITHUB_REPOS.map(([o, r]) => `${o}/${r}`),
  soundcloudFeed: "https://feeds.soundcloud.com/users/soundcloud:users:1681714067/sounds.rss",
  noaaDailySsn: "https://services.swpc.noaa.gov/json/solar-cycle/swpc_observed_ssn.json",
  noaaMonthlyF107: "https://services.swpc.noaa.gov/json/solar-cycle/f10-7cm-flux.json",
  noaaMonthlySunspots: "https://services.swpc.noaa.gov/json/solar-cycle/sunspots.json",
  lastNoaaMonth: lastNoaaMonth || null,
  ionosphereNote:
    "Weekly F10.7 here is derived from NOAA’s published **monthly** 10.7 cm flux: each day in a month is assigned that month’s value, then averaged over the UTC week. That aligns the ionosphere driver on the same Monday-week axis as daily sunspot means and Git events. It is not sub-monthly true daily F10.7.",
};

const findings = buildFindings(periods, commits, sc.uploads, sc.minutes, solar.sunspots, solar.f107, sources);

const snapshot = {
  generatedAt: new Date().toISOString().slice(0, 10),
  granularity: "week",
  startMonth: START_MONTH,
  startPeriod: periods[0],
  endPeriod: periods[periods.length - 1],
  periods,
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
