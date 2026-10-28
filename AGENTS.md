# Project Instructions

## Purpose

This repository may be worked on using both Claude Code and OpenAI Codex.

All coding agents must use the repository files, current codebase, and Git history as the shared source of context. Do not assume access to conversations held with another agent.

## Sources of truth

Before making product, design, UX, architecture, or implementation changes, read the relevant project documentation:

* `prd.md` — product requirements and intended functionality
* `design-brief.md` — approved visual direction and design requirements
* `decision-list.md` — important product, design, and technical decisions already made
* `PROJECT_STATUS.md` — current implementation status, completed work, remaining work, known issues, and run instructions
* any other relevant research, requirements, or planning documents in the repository

Use these sources according to their purpose:

* The PRD is the source of truth for what the product should do.
* The design brief is the source of truth for how the product should look and feel.
* The decision list is the source of truth for questions that have already been settled.
* The project status file is the source of truth for the current working state.
* The current codebase and automated tests are the source of truth for what has actually been implemented.

If two sources appear to conflict, identify the conflict before making a major change. Do not silently choose one interpretation.

## Before starting work

Before making meaningful changes:

1. Read the relevant project documentation.
2. Inspect the current repository structure.
3. Check `git status`.
4. Review recent relevant commits or diffs when needed.
5. Inspect the existing implementation before proposing a replacement.
6. Confirm whether the requested functionality already exists in full or in part.

Do not begin by rewriting or restructuring the project without first understanding the current state.

## Working rules

* Preserve the product intent documented in `prd.md`.
* Preserve the approved visual direction documented in `design-brief.md`.
* Check `decision-list.md` before revisiting a previously settled question.
* Keep changes focused on the requested task.
* Do not modify unrelated files.
* Reuse the existing framework, architecture, components, utilities, and conventions where reasonable.
* Prefer extending existing code over replacing working code.
* Do not redesign approved interfaces unless explicitly asked.
* Do not expand the product scope beyond the PRD unless explicitly asked.
* Do not add a backend when mock data, local state, or `localStorage` is sufficient for the current milestone.
* Do not add unnecessary dependencies.
* Do not expose secrets, credentials, private keys, or tokens.
* Do not commit `.env` files or other files containing secrets.
* Do not use destructive Git or filesystem commands without explicit approval.
* Do not overwrite or substantially rewrite project requirement documents unless explicitly asked.
* Do not treat generated design code as automatically production-ready; inspect it before integrating it.
* Do not depend on tool-specific runtime functionality that will not work in a normal local development environment.

## Design and frontend implementation

When implementing or modifying the frontend:

* Follow the visual direction in `design-brief.md`.
* Follow the product flows and requirements in `prd.md`.
* Use `decision-list.md` to preserve previously approved choices.
* Reproduce approved screens and interactions as closely as reasonably possible.
* Use reusable components rather than large monolithic files.
* Keep components and files clearly named and organized.
* Implement responsive behaviour for desktop, tablet, and mobile where required.
* Include relevant loading, empty, validation, error, success, and disabled states.
* Use realistic mock data when real backend data is unavailable.
* Preserve accessibility basics, including:

  * semantic HTML
  * form labels
  * keyboard-accessible controls
  * visible focus states
  * useful alternative text
  * appropriate button and link elements
* Avoid placeholder functionality for core user flows unless the limitation is clearly documented.

## Code quality

* Follow the conventions already present in the repository.
* Keep implementations readable and maintainable.
* Avoid unnecessary abstractions.
* Avoid duplicating logic or components when an existing reusable option is available.
* Remove unused imports, variables, files, and dependencies introduced by the task.
* Handle likely errors and edge cases.
* Do not leave the repository in a knowingly broken state.
* Add or update comments only where they clarify non-obvious behaviour.
* Do not add large amounts of generated documentation or commentary inside source files.

## Verification

After making code changes, run the relevant available checks:

* dependency installation, when required
* TypeScript or type checking
* linting
* automated tests
* production build
* local development server
* manual verification of the affected user flow

Fix errors caused by the changes before declaring the task complete.

Clearly report:

* which checks were run
* which checks passed
* which checks failed
* which checks could not be run
* any remaining known issues

Do not claim that something works unless it was reasonably verified.

## Documentation responsibilities

### `PROJECT_STATUS.md`

After meaningful implementation work, update `PROJECT_STATUS.md` with:

* what was completed
* what currently works
* what remains
* known issues or limitations
* the current objective
* exact installation and run instructions, when available
* verification status, when useful

Keep this file current and concise.

Do not place full chat transcripts or lengthy session logs in it.

### `decision-list.md`

Update `decision-list.md` only when an important and lasting product, design, architecture, or technical decision has been made.

A decision entry should normally include:

* the date
* the decision
* the reason
* important implications or constraints

Do not add:

* routine implementation details
* temporary debugging steps
* every file changed
* ordinary session summaries
* conversation transcripts
* decisions that were merely suggested but not adopted

### `AGENTS.md`

Do not update `AGENTS.md` to record normal project progress.

Only change it when the durable working instructions for coding agents genuinely need to change.

## Multi-agent workflow

This project may be edited using Claude Code and OpenAI Codex.

To keep handoffs reliable:

* Treat the repository files and Git history as the shared context between agents.
* Do not assume one agent can see the other agent’s conversation.
* Do not copy entire session histories into `CLAUDE.md`, `AGENTS.md`, or `decision-list.md`.
* Do not maintain separate Claude and Codex versions of project status.
* Do not run multiple coding agents against the same files simultaneously.
* Before switching agents, finish or stop the active task cleanly.
* Review the current diff before handing the project to another agent.
* Update `PROJECT_STATUS.md` after meaningful work.
* Update `decision-list.md` only when a durable decision was made.
* Prefer making a Git commit before switching agents.
* If changes are intentionally left uncommitted, clearly document their state and purpose in the handoff.

## Branch and deployment hygiene

* Start feature work from a clean checkout of the canonical production branch.
* Use one clean branch per feature. Uncommitted work follows branch switches and is not branch isolation.
* Keep incomplete feature routes, navigation, and integrations confined to that feature's branch.
* Do not deploy production from a dirty working tree or from a manually filtered copy of one.
* Once production is connected to Git, deploy production only from the configured canonical branch after reviewed changes are merged.

## Git rules

* Inspect `git status` before meaningful work.
* Keep changes limited to the requested scope.
* Do not discard existing uncommitted changes unless explicitly asked.
* Do not use `git reset --hard`, force pushes, destructive cleans, or history rewriting without explicit approval.
* Do not automatically commit unless explicitly asked.
* Before requesting approval to commit, provide a concise summary of the changed files and verification completed.

## Task completion

Before declaring a meaningful task complete:

1. Confirm that the requested functionality has been implemented.
2. Run the relevant verification checks.
3. Review the final diff for unrelated or accidental changes.
4. Update `PROJECT_STATUS.md`.
5. Update `decision-list.md` only if a durable decision was made.
6. Summarize:

   * what changed
   * what was verified
   * what remains
   * any known issues
7. Do not make a Git commit unless explicitly asked.
