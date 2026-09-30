const { Constants, EToolResources } = require('librechat-data-provider');
const { logger } = require('@librechat/data-schemas');
const db = require('~/models');

/**
 * KMH: a plain-language summary of what one agent can actually reach.
 *
 * The landing screen used to show only the agent's `description` — prose
 * somebody has to write and then remember to update. This is derived from the
 * agent record instead, so it cannot drift: wire a new MCP server to an agent
 * and the summary says so on the next page load.
 *
 * Deliberately VIEW-scoped and deliberately thin. `/expanded` carries the
 * instructions and the full tool payloads and needs EDIT, which most account
 * managers do not have on an agent they merely use. Nothing sensitive belongs
 * here: no instructions, no file ids, no tokens, no server URLs — only the
 * titles a person would recognise and counts.
 */

/** `<tool>_mcp_<server>` — the server name is the tail. */
function mcpServerOf(toolKey) {
  const i = toolKey.lastIndexOf(Constants.mcp_delimiter);
  return i === -1 ? null : toolKey.slice(i + Constants.mcp_delimiter.length);
}

/** Naming convention, not capability detection: these prefixes are ours.
 *  An unrecognised server is reported without a kind rather than guessed at. */
function kindOf(serverName) {
  if (serverName.startsWith('klaviyo-')) {
    return { kind: 'klaviyo', writes: false };
  }
  if (serverName.startsWith('stratos-')) {
    return { kind: 'stratos', writes: true };
  }
  return { kind: 'other', writes: null };
}

async function getAgentCapabilities(req, res) {
  try {
    const agent = await db.getAgent({ id: req.params.id });
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    /** `mcpConfig`, not `mcpServers`: the YAML key is renamed when the app
     *  config is assembled, and reading the YAML name silently yields the
     *  server id instead of the brand title. */
    const configured = req.config?.mcpConfig ?? {};
    const tools = Array.isArray(agent.tools) ? agent.tools : [];

    /** One entry per server, not per tool: an agent with 23 Klaviyo tools has
     *  one data source, and listing 23 rows would bury the Stratos one. */
    const servers = new Map();
    const builtins = new Set();
    for (const toolKey of tools) {
      const server = mcpServerOf(toolKey);
      if (!server) {
        builtins.add(toolKey);
        continue;
      }
      if (servers.has(server)) {
        continue;
      }
      const { kind, writes } = kindOf(server);
      servers.set(server, {
        name: configured[server]?.title || server,
        kind,
        writes,
      });
    }

    const fileIds = agent.tool_resources?.[EToolResources.file_search]?.file_ids;

    /** Skills are stored as ids. A name the user recognises needs the lookup,
     *  and a skill that has since been deleted is skipped rather than shown as
     *  a dangling id. */
    let skills = [];
    if (agent.skills_scope === 'selected' && Array.isArray(agent.skills)) {
      const found = await Promise.all(
        agent.skills.map((id) => db.getSkillById(id).catch(() => null)),
      );
      skills = found.filter(Boolean).map((s) => s.name);
    }

    res.status(200).json({
      id: agent.id,
      model: agent.model ?? '',
      dataSources: [...servers.values()].sort((a, b) => a.name.localeCompare(b.name)),
      knowledgeFiles: Array.isArray(fileIds) ? fileIds.length : 0,
      skills,
      abilities: {
        fileSearch: builtins.has('file_search'),
        webSearch: builtins.has('web_search'),
        executeCode: builtins.has('execute_code'),
        artifacts: builtins.has('artifacts'),
      },
    });
  } catch (error) {
    logger.error('[/agents/:id/capabilities] failed:', error);
    res.status(500).json({ error: 'Failed to load agent capabilities' });
  }
}

module.exports = { getAgentCapabilities };
