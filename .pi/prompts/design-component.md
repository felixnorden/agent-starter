---
description: Build one UI component with the Hallmark skill, including the 8-state demo wrapper.
argument-hint: "<component and target file>"
---

Load the `hallmark` skill and run its Component-scope flow, not the page Design flow.

Component: ${@:-the component named in this project's context}.

Requirements:

- Skip the macrostructure, nav, footer, and hero steps. Say "Component-scope: skipping macrostructure."
- Adopt the project's existing tokens, fonts, and framework conventions. Do not invent a theme when a system already exists.
- Ship all 8 states: default, hover, focus-visible, active, disabled, loading, error, success.
- Emit the component file plus a `<Component>.preview.html` (or `.preview.tsx`) wrapper that renders all 8 states, each labelled. The wrapper is not production code.
- Stamp the output with the `component:` prefix. Do not write a `.hallmark/log.json` entry.

If the brief is ambiguous between one component and a whole page, ask once and default to component.
