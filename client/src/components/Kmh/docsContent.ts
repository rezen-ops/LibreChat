/**
 * KMH system documentation, shown in the Docs sidebar tab.
 *
 * Plain markdown so account managers can edit it without touching React. It is
 * bundled at build time, which means a docs change is a git push — the same
 * path as a skill change.
 */
export const KMH_DOCS = `
# How this system works

One chat tool, one login, every client. Below is what each piece does and how to
use it.

---

## The shape of it

Each client has **one agent**. That agent is connected to that client's Klaviyo
account and nothing else — the connection is locked by a token on our side, so an
agent physically cannot read another client's data even if you ask it to.

| Piece | What it is |
|---|---|
| **Agent** | One per client. Holds the instructions, the Klaviyo connection, and that client's documents. |
| **Klaviyo tool** | Live, read-only access to one client's account. 23 tools — campaigns, flows, segments, lists, templates. |
| **Knowledge files** | Documents you upload to a specific agent. Only that agent can read them. |
| **Skills** | Shared house rules. Typed with \`$\` when you want one. |
| **Prompts** | The library imported from TypingMind. Reusable starting points. |

---

## Creating an agent for a client

1. Open the agent picker and select **KMH Template**.
2. Click **Duplicate**.
3. Rename it to the client, e.g. *Arrowhead Tactical Copywriter*.
4. Under **Tools → Add**, choose that client's Klaviyo server — they are named
   \`klaviyo-<client>\`. Pick the right one; this is what locks the agent to that
   account.
5. Write the instructions. This is the agent's brief: tone, what it should
   prioritise, anything specific to the client.
6. **Save.**

The template carries the shared skills, so a new agent starts with house rules
already attached.

---

## Adding a client's knowledge documents

Upload them **inside the agent**, not through the paperclip in the chat box.

1. Open the agent.
2. Under **Tools**, click **File Search**.
3. Upload the files there. Markdown, PDF, Word, CSV, plain text all work.
4. **Save.**

Files uploaded this way belong to that agent alone. Every other agent is blind to
them.

> The paperclip in the chat box is different — it attaches a file to *one
> conversation*, and it lists everything you have ever uploaded. Use it for a
> one-off. Use File Search for anything the agent should know permanently.

---

## Using skills

Skills are shared rules — reporting standards, brand voice, how to pick a
Klaviyo tool. They never fire on their own. Type **\`$\`** in the chat box and
pick one when you want it applied.

| Skill | Use it for |
|---|---|
| \`$kmh-reporting-standards\` | Reporting performance — denominators, comparison windows, caveats |
| \`$kmh-brand-voice\` | Writing or reviewing customer-facing copy |
| \`$kmh-klaviyo-tools\` | Choosing the right Klaviyo tool for a question |
| \`$kmh-cost-discipline\` | Planning tool calls before pulling a lot of data |

Because they are shared, editing one updates every agent at once. Ask an
engineer for a change rather than editing an agent's instructions.

---

## Asking about client data

Ask the client's agent in plain language:

- *How did campaigns perform over the last 30 days?*
- *Which flow is driving the most revenue?*
- *Compare this month against last month.*
- *Which subject lines worked best this quarter?*

Two things to know:

**Timeframes are fixed.** Only 7, 30, 90 and 365 days are available. There is no
60-day option — ask for 90 and narrow by send date.

**A short window is a small sample.** A week might be two campaigns. That is a
direction, not proof. Ask for 365 days when you need real signal.

---

## Pushing a calendar to Stratos

Agents for brands that exist in Stratos can write campaign calendars straight
into the planner. You do not copy anything across by hand.

**Everything lands as a draft.** The agent cannot send, schedule, approve, edit
or delete. A campaign it creates sits in the brand's planning calendar exactly
where a draft you typed yourself would, and the team reviews it the same way.

### How to do it

It is two steps on purpose, and the agent will not skip to the second.

**1. Ask for the calendar.** *Build me a campaign calendar for November.* The
agent replies in the chat with the whole month for you to read. Nothing has
been written yet. Change whatever you want and ask again.

**2. Say push, explicitly.** *Push that to Stratos.* Only then does it write.
It checks the brand it is connected to, looks at what is already in that window
so it does not double up, and creates the month in one go. It reports back which
campaigns were created and which failed, with reasons.

If you want changes after a push, make them in Stratos. There is no undo from
the chat.

### Why it cannot write to the wrong brand

Each agent holds one brand's key, and the server works out the brand from that
key alone. If you tell the agent to write to a different brand, the instruction
is ignored — it is not that it refuses, it is that the brand is not something
the agent gets to choose. The same is true of the Klaviyo connection.

Ask *which brand are you connected to?* any time you want to check.

### What the planner will reject

These come back as errors on the individual campaign, and the rest of the batch
still goes through:

- **A duplicate** — same name and same send date as a campaign already there.
  This is what makes a retry safe after a partial failure.
- **A date too far out** — more than a year in the past or roughly thirteen
  months ahead.
- **A value outside the vocabulary** — segment, angle and type have to match
  what Stratos itself accepts. If the agent invents a segment name, the planner
  says no rather than storing something the app cannot show.
- **An archived brand.**

That last group is the reason to push through the agent rather than by hand: a
calendar with a made-up segment never reaches the planner at all.

### Brands without a planner

Not every Klaviyo client exists in Stratos. If an agent has no planner
connection, the capability strip under its name will not mention drafts, and
asking it to push will get you a calendar in the chat and nothing more. Tell
Stan and the brand can be added.

---

## Models

Pick per conversation from the model selector:

| Model | Use it for |
|---|---|
| **KMH Fast** | Drafting, summarising, reformatting, quick lookups |
| **KMH Standard** | Analysis, multi-step reporting, anything needing judgement |
| **KMH Deep** | Genuinely hard analysis. Costs several times Standard. |

Fast is the default and handles most work. The running cost of a conversation is
shown in the interface — nothing is capped, but it is visible.

---

## Prompts

The library from TypingMind, organised by the same categories. Open the prompts
panel, pick one, and it fills the chat box ready to edit.

---

## Search

Search box at the top of the sidebar searches every past conversation and
message, not just titles.

---

## When something is wrong

**The agent says it cannot see data** — check the right \`klaviyo-<client>\`
server is attached under Tools.

**It cannot find something in a document** — confirm the file is under the
agent's **File Search**, not attached to a single conversation.

**A number looks wrong** — ask it which tool and timeframe it used. It will tell
you, and that usually explains the discrepancy.

**Something is broken** — note the agent and what you asked, and send it to an
engineer.
`;
