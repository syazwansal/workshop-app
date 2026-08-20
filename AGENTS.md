<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# User Customization Rules

- Inspect the real project before planning or editing.
- Reuse the existing framework, components, styles, and assets.
- Do not install, upgrade, or add packages.
- Do not change database, authentication, environment files, MCP configuration, or deployment settings unless explicitly requested.
- Keep customization changes visible, reversible, and browser-verifiable.
- Change only files included in the approved plan.
- Make the smallest coherent edit that delivers the requested goal.
- Keep pages responsive and keep labels and alt text intact.
- Avoid optional improvements and unrelated cleanup.
- Before each file edit, explain in one line why the edit is necessary.
- After implementation, show the full diff when requested and do not commit unless explicitly asked.
- For validation, use existing `package.json` scripts, report each check as PASS or FAIL, and only fix failures caused by the requested change after approval.
