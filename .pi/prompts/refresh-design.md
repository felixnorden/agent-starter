---
description: Redesign an existing page or screen in place with the Hallmark skill. Preserves content and structure.
argument-hint: "<target file or route> [--mood <name>]"
---

Load the `hallmark` skill and follow its `redesign` verb (read `references/verbs/redesign.md` before editing).

Target: ${1:-the page named in this project's context}. Optional mood or extra direction: ${@:2}

Rules:

- Preserve routes, component ownership, copy intent, brand, and information architecture. Replace only the visual and interaction layer in scope.
- Default to in-place edits inside the existing implementation. Stop and ask before a full rebuild or any file deletion.
- State the exact files you expect to modify, create, or delete before you edit. Deletions need explicit confirmation.
- Pick a new section rhythm, heading placement, and component voice. Do not clone the current layout.
- Re-run the 58-gate slop test, restamp the output, and append the run to `.hallmark/log.json`.
