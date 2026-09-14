---
name: kmh-cost-discipline
description: 'Planning tool calls before pulling data: choosing a date range, a limit, and avoiding fetches you will not use. Applies when a question needs tools.'
always-apply: false
user-invocable: true
disable-model-invocation: true
---

# Cost discipline

Every tool result stays in context for the rest of the conversation and is
re-billed on every subsequent turn. Data you pull and do not use is not free —
it is a recurring charge for the length of the chat.

## Before calling

- Decide the date range from the question. "Last month" is a specific range;
  work it out and pass it, rather than pulling a year and filtering.
- Pick the coarsest grain that answers the question. A monthly trend does not
  need daily rows.
- Ask for the smallest useful `limit`. Ten rows usually answers "top campaigns";
  a hundred does not answer it better.

## While answering

- Do not restate the full table back to the user. Quote the rows that carry the
  finding.
- Do not re-call a tool with the same arguments to "check" — the result is
  already in context above.

## Escalation

If a question genuinely needs a wide scan, say what you are about to do and why
before doing it. A wide call made deliberately is fine; a wide call made by
reflex is the thing we are avoiding.
