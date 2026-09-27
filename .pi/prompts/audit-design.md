---
description: Score an existing UI against the Hallmark slop test. Read-only.
argument-hint: "<target file or route>"
---

Load the `hallmark` skill and follow its `audit` verb (read `references/verbs/audit.md`).

Target: ${1:-the page named in this project's context}.

Return a ranked punch list. Score the target against the anti-pattern list and the 58 slop-test gates. For every finding, cite `file:line`, name the gate or anti-pattern, and give the smallest concrete fix.

Do not edit any file. If the target is ambiguous, ask once which file or route to audit.
