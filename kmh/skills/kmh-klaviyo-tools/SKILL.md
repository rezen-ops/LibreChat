---
name: kmh-klaviyo-tools
description: 'Choosing which Klaviyo tool answers a question about campaigns, flows, segments, lists or templates, and how to combine copy with performance.'
always-apply: false
user-invocable: true
disable-model-invocation: true
---

# Klaviyo tools

You have live, **read-only** access to exactly one client's Klaviyo. Your
connection token already selects the account — never pass a brand name, and
never assume you can see another client. You cannot reach one.

## Rules

- Pull the numbers before answering. Never invent a metric, and never estimate
  one to fill a gap — say which part you couldn't get.
- Read and analyse only. You cannot send, schedule, edit or delete. Hand
  finished copy back for a human to publish.
- Timeframes are fixed: `last_7_days`, `last_30_days`, `last_90_days`,
  `last_365_days`. There is no 60-day option — use 90 and filter by send date.
- A short window means few campaigns, which means a directional pattern, not
  proof. Say so. Reach for `last_365_days` when you need real signal.

## Which tool

**Campaigns**
- `get_campaign_performance` — per-campaign opens, clicks, revenue, unsubs
- `get_campaign_content(campaign_id)` — subject plus full body copy
- `get_recent_subject_lines` — recent subjects, cheap and fast
- `get_campaign_calendar` — what is scheduled or sent, by date

**Flows**
- `get_flow_performance` — per-flow metrics; filter `status=live` for active only
- `get_flow_message_performance(flow_id)` — per-email metrics inside one flow
- `get_flow_email_content(flow_id)` — every email's copy in a flow, one call
- `get_flow_details(flow_id)` — structure and steps
- `get_flow_health_check` — configuration problems

**Audience**
- `get_segment_summary` / `get_segment_growth` — size and growth
- `get_list_summary` — list stats
- `get_subscriber_conversion_cohort` — cohort conversion
- `lookup_profile` / `search_by_tag`

**Metrics, health, forms**
- `get_metrics_aggregate` — aggregate any metric
- `get_events` — recent events
- `get_account_health` — deliverability
- `get_form_performance` — popups and signup forms

**Templates**
- `list_email_templates` / `get_email_template` / `render_email_template`

## Workflows worth knowing

**Copy against results, campaigns.** `get_campaign_performance` first, then
`get_campaign_content` for the few that matter, then compare copy patterns to
open, click and revenue.

**Copy against results, flows.** `get_flow_performance`, then for the flow in
question `get_flow_message_performance` and `get_flow_email_content` together —
that shows which specific email carries the flow.

**Keep it cheap.** Cap content fetches to the top few by revenue. Content calls
return full email bodies and are the most expensive thing you can do here.
