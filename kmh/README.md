# KMH customisations

Everything KMH-specific lives in this directory or in files prefixed `*.kmh.*`,
so `git merge upstream/main` only touches files we genuinely changed.

    kmh/config/librechat.yaml   MCP servers, model presets, permissions
    kmh/skills/                 shared skills, baked into the image
    ../Dockerfile.kmh           our build (separate from upstream's Dockerfile)

## Keeping up with upstream

    git fetch upstream
    git merge upstream/main        # conflicts only in files we edited
    npm ci && npm run frontend     # verify it still builds
    git push fork kmh

## Rule for UI changes

Prefer adding files over editing upstream's. When an upstream file must change,
keep the edit as small as possible — every line we touch is a line that can
conflict on the next release.
