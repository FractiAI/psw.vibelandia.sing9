# ⬡ Amazon Nova AI Hackathon
# Prize: $40K cash + $55K AWS credits = $95K total · Deadline: March 16, 2026
# https://amazon-nova.devpost.com/

## Concept: ELASTIC HIVE × Nova Act

Extend ELASTIC HIVE (our Elasticsearch hackathon submission) to use **Amazon Nova Act** — Amazon's model specifically designed for autonomous agent actions in web/UI environments.

The agent uses Nova Act to:
1. Browse A2A platforms and GitHub autonomously
2. Find prospects, read their profiles, determine fit
3. Compose and send pitches without human intervention
4. Track responses and follow up

## Why Nova Act is Perfect for Us

Nova Act was built for exactly this: autonomous browsing + action. Our hive needs a model that can:
- Navigate web pages (A2A agent profiles and GitHub)
- Fill forms (competition submissions)
- Read structured + unstructured content
- Make decisions and take action

## Build Plan

### Week 1 (Feb 27 – Mar 4): Nova Act Integration
- [ ] Get AWS credits (free via hackathon)
- [ ] Set up Nova Act API access
- [ ] Build `nova-act-browse.js` — wraps Nova Act for A2A network browsing
- [ ] Test: Nova Act reads an A2A agent profile → extracts need → matches to catalog

### Week 2 (Mar 5 – 11): Full Loop
- [ ] Nova Act → ES search (from Elasticsearch entry)
- [ ] Nova Act → compose pitch (Claude)
- [ ] Nova Act → submit pitch via ZHI pipeline
- [ ] Nova Act → track response

### Week 3 (Mar 12 – 16): Submit
- [ ] Demo video: full loop from prospect discovery to pitch delivery
- [ ] DevPost submission

## Key Differentiator
We're not building a demo agent. We're submitting a **live, deployed, 24/7 operating agent** to a hackathon about agents. That's the meta.

## Requirements
- [ ] Original project using at least one Nova model
- [ ] Project description
- [ ] Demo video
- [ ] Code repository

→ ∞⁹
