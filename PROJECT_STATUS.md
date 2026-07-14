# Project Status

Last updated: 2026-07-14

## Current objective

Convert the approved Claude Design output into a complete, standalone frontend application that can be run locally and developed through Cursor using either Claude Code or OpenAI Codex.

## Current working state

The project repository currently contains planning and design documentation, including:

* `prd.md`
* `design-brief.md`
* `decision-list.md`
* `AGENTS.md`
* `CLAUDE.md`, if already created
* other supporting project documents

The project design has already been created using Claude Design based on `design-brief.md`.

It has not yet been confirmed whether the Claude Design output is:

* only a visual design
* an interactive prototype
* an exported HTML bundle
* or a complete, maintainable frontend codebase

A locally runnable frontend has not yet been confirmed.

## Completed

* Product requirements have been documented in `prd.md`.
* Design requirements have been documented in `design-brief.md`.
* Important existing decisions have been documented in `decision-list.md`.
* An initial project design has been created in Claude Design.
* Shared coding-agent instructions have been created in `AGENTS.md`.
* A shared workflow has been defined for using both Claude Code and OpenAI Codex.

## In progress

* Preparing the Claude Design output for functional frontend implementation.
* Establishing a reliable handoff from Claude Design to the local project repository.
* Preparing the repository to be opened and developed through Cursor.

## Next immediate step

Ask Claude Design to review the existing design against:

* `prd.md`
* `design-brief.md`
* `decision-list.md`

Then request a functional frontend handoff or the most complete available source-code export.

Do not begin rebuilding the frontend before confirming what code or export Claude Design can provide.

## Planned subsequent steps

1. Obtain the Claude Design handoff or export.
2. Add the handoff to the repository without overwriting the project documentation.
3. Inspect the exported files before changing them.
4. Determine whether the handoff is reusable as a standalone application.
5. Create or complete the locally runnable frontend.
6. Install dependencies.
7. Run the local development server.
8. Verify the implementation against the PRD and design brief.
9. Run linting, type checking, tests, and a production build where available.
10. Review the final changes and make a Git checkpoint.

## Known issues and unknowns

* The frontend framework has not yet been confirmed.
* The package manager has not yet been confirmed.
* Local installation commands are not yet known.
* Local development server commands are not yet known.
* A successful production build has not yet been confirmed.
* It is not yet known whether Claude Design generated reusable source code.
* It is not yet known whether the design relies on Claude-specific runtime functionality.
* It is not yet known whether all PRD screens and user flows are represented in the current design.
* Backend requirements, if any, have not yet been assessed for the frontend milestone.
* The final repository structure for the frontend has not yet been decided.

## Current product and design sources

### Product requirements

`prd.md`

Use this file to determine:

* required features
* user flows
* functional behaviour
* product scope
* success criteria

### Design requirements

`design-brief.md`

Use this file to determine:

* visual direction
* layout
* styling
* interaction expectations
* responsive behaviour
* design principles

### Existing decisions

`decision-list.md`

Check this file before revisiting product, design, architecture, or technical choices that may already have been settled.

### Agent instructions

`AGENTS.md`

This is the shared source of durable working instructions for coding agents.

Claude Code should also load these instructions through `CLAUDE.md`.

## How to run

Local run instructions are not yet available.

Add the exact commands here once a runnable frontend has been created or integrated.

Expected format:

```bash
cd <frontend-directory>
npm install
npm run dev
```

Do not assume these commands are correct until the actual framework and package manager have been inspected.

## Verification status

### Not yet verified

* dependency installation
* local development server
* TypeScript or type checking
* linting
* automated tests
* production build
* responsive behaviour
* primary user flows
* accessibility basics
* persistence behaviour
* compatibility outside Claude Design

## Current expected repository structure

```text
project-root/
├── AGENTS.md
├── CLAUDE.md
├── PROJECT_STATUS.md
├── decision-list.md
├── design-brief.md
├── prd.md
├── other supporting documents
└── frontend or design handoff files
```

The exact frontend directory and structure will be updated after the Claude Design handoff has been received and inspected.

## Handoff notes

Claude Code and OpenAI Codex must both read:

* `AGENTS.md`
* `PROJECT_STATUS.md`
* `decision-list.md`
* `prd.md`
* `design-brief.md`

They must also inspect:

* the current codebase
* `git status`
* recent relevant commits or diffs

Progress should be recorded in this file.

Durable product, design, architecture, and technical decisions should be recorded in `decision-list.md`.

Normal session history should not be copied into either file.
