---
description: Build a new page or UI with the Hallmark skill. Runs the default Design flow.
argument-hint: "<brief>"
---

Load the `hallmark` skill (read its `SKILL.md`, then the reference files it names).

Design and build: ${@:-the page described in this project's context}.

Run the default Hallmark Design flow end to end:

1. Pre-flight scan. Report the font stack, palette, motion stance, spacing scale, and framework you found. State what you will preserve and what you will introduce.
2. Design-context gate. Ask for Audience, Use case, and Tone once. If the user says "go ahead", infer them and state the inference in one sentence.
3. Pick a genre, a macrostructure, nav and footer archetypes, and a theme. State every pick out loud, and say how the theme differs from the last entry in `.hallmark/log.json` on paper band, display style, or accent hue.
4. Emit the Step 5 preview block before writing any code.
5. Build, run the 58-gate slop test, stamp the output CSS, and append the run to `.hallmark/log.json`.

Page scope. Match the framework and tokens found in the pre-flight scan. Never overwrite an existing global stylesheet unless the user asks.
