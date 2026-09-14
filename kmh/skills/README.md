# Skills

A skill is **a markdown file whose text gets added to the system prompt** when it
applies. That is the entire mechanism. No model-specific API — Claude, GPT and
Grok all just receive text, so the same skill works identically on any of them.

## They are optional

An agent with zero skills works fine. Skills exist for one reason: a rule you
want followed the same way by many agents, changed in one place.

## When does a skill apply?

Three modes, set in the frontmatter:

| Mode | Frontmatter | When it loads |
|---|---|---|
| **Model-invoked** (default here) | `always-apply: false` | The model sees only the skill's *description*. It loads the body **only when the description matches the task.** |
| Manual | `user-invocable: true` | Someone types `$skill-name` |
| Always on | `always-apply: true` | **Every single turn.** Billed every turn. Use almost never. |

Every skill here is **model-invoked**. Ask a data question and the copywriting
skill is not loaded — the model never sees more than its one-line description.

This makes the `description:` line the most important line in the file. It is
not documentation; it is the trigger. Write it as *when to use this*, not *what
this is*.

## Scope per agent

Separately, each agent chooses which skills it can see at all — `skills_scope:
selected` with an explicit list. So an agent that never writes copy need not
carry `kmh-brand-voice` in the first place.

Two independent gates: **what the agent carries**, then **what the task loads**.

## Why this over putting rules in the prompt

Account managers duplicate the template to make a client agent. Duplication is a
one-time copy — improving the master prompt later does nothing for the 60 agents
already made. A skill edit reaches all of them on the next deploy.

Rule of thumb: **per-client and voice → the prompt. Consistent across clients →
a skill.**

## Editing

    vim skills/kmh-reporting-standards/SKILL.md
    npm run check
    git commit -am "..." && git push      # Railway rebuilds; live for all agents
