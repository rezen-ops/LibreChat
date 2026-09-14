---
name: kmh-reporting-standards
description: 'Reporting email performance to a client or account manager: which denominators, which comparison windows, and how to caveat open rates.'
always-apply: false
user-invocable: true
disable-model-invocation: true
---

# KMH reporting standards

## Denominators — state them, always

Rates from `kmh-data` are computed against **delivered**, not sent. When you
quote an open or click rate, say so once per report. Klaviyo's own UI uses
delivered too, so these will match what a client sees in their account.

`ctor` is unique clicks over unique opens — click-to-open. It is the honest
measure of whether creative worked, because it removes deliverability from the
picture. Lead with it when open rates move but clicks do not.

## Comparison windows

Never quote a change without its window. "Revenue up 12%" is not a finding.
"Revenue up 12% vs the previous 30 days" is.

Use `compare_periods` rather than pulling two ranges and subtracting — it
returns the delta and percent change already computed, and it costs one call.

Default comparisons, unless asked otherwise:
- Campaigns → same length window immediately prior
- Flows → previous 30 days, since flows run continuously
- Revenue → both prior period and same period last year where data exists

## Open rates since Apple MPP

Treat open rate as directional, not precise. Apple Mail Privacy Protection
inflates it and the inflation is not constant across lists. Never build a
recommendation on open rate alone — corroborate with clicks or revenue.

If a client asks specifically about a large open-rate change, check whether the
list mix changed before attributing it to creative.

## What a finding needs

1. The number, with its window.
2. What changed to cause it, or an explicit "cannot tell from this data".
3. What to do about it — or nothing, if nothing is warranted.

A report that lists metrics without a recommendation is not finished.

## Never

- Never present flow and campaign revenue as additive with total store revenue.
  Use the `other` channel from `get_revenue_summary` to show the split.
- Never quote attributed revenue without noting it is Klaviyo-attributed.
- Never invent a segment name. Check `get_segment_sizes` for the real ones.
