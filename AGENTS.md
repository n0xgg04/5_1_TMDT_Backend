# Agent Rules

These rules apply to every AI coding agent working in this repository, including Codex, Claude, and Cursor.

## Required First Reads

Before planning, proposing, reviewing, or editing code, docs, config, or tests, read the project context in this order:

1. `general-docs/IMPORTANT.md`
2. `general-docs/ARCHITECH.md`
3. `general-docs/MEMBERS.md`

Then read the relevant source files, package files, and OpenSpec artifacts for the task.

Do not skip `general-docs` because a request looks small. The only exception is a purely mechanical command that does not reason about or change project behavior, such as `git status` or listing files.

If `general-docs`, OpenSpec artifacts, source code, and the user's request conflict, state the conflict before proceeding. Direct user instructions take priority, but stale docs must be called out explicitly.

## OpenSpec Workflow

OpenSpec is the default workflow for every feature, bug fix, refactor, architecture change, meaningful documentation change, or configuration change.

1. Discover current work:
   - Run `openspec list --json`.
   - If the user names an existing change, use that change.
   - If exactly one active change is clearly relevant, use it.
   - If no change exists for the task, create one with `openspec new change "<kebab-name>"`.
   - If multiple changes could apply, ask which change to use.

2. Prepare artifacts before implementation:
   - Run `openspec status --change "<name>" --json`.
   - Use the returned `planningHome`, `changeRoot`, `artifactPaths`, and `actionContext`; do not assume fixed paths.
   - Generate required artifacts in dependency order using `openspec instructions <artifact-id> --change "<name>" --json`.
   - Read dependency artifacts before writing the next artifact.
   - Continue until every apply-required artifact is complete.

3. Implement from OpenSpec tasks:
   - Start implementation only after apply-required artifacts are complete, unless the user explicitly asks for an emergency direct patch.
   - Run `openspec instructions apply --change "<name>" --json`.
   - Read every file listed in `contextFiles`.
   - Implement pending tasks one at a time.
   - Keep changes minimal and scoped to the current task.
   - Mark each task complete in the tasks artifact immediately after it is actually complete.

4. Validate and finish:
   - Run the relevant project checks for the files changed.
   - Run `openspec validate "<name>" --strict` before reporting completion.
   - When all tasks are complete, archive only when requested or approved with `openspec archive "<name>"`.

## Branching

- `main` is the stable release branch.
- `develop` is the integration branch.
- Use `feat/<slug>` for feature branches.
- Use `fix/<slug>` for bugfix branches.
- Do not rewrite, discard, or revert user changes without explicit approval.

