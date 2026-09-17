@AGENTS.md

## Claude-specific notes

- The Playwright MCP server is configured in `.mcp.json`; use it for
  browser-based verification instead of manual `curl` where the check is
  about rendered UI or console/network behavior.
- Postgres runs via `docker compose up -d`; connect with
  `docker compose exec db psql -U sundial -d sundial` for direct database
  checks.
- Before running `git commit` on a non-trivial change, run the
  `openspec-verify-change` skill against the staged diff.
