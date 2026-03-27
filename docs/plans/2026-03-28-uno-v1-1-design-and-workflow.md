# Uno v1.1 Design And Workflow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade Uno into a more distinctive desktop organizer by adding safer file operations, richer rules, progress and cancel support, undo, stronger suggestions, and a more memorable visual design.

**Architecture:** Expand the shared rule and task types first, then upgrade main-process services and IPC to support progress-aware long-running jobs and undo. Refactor the renderer from one large file into focused page/components, then layer a stronger visual system and better workflow UX on top of the new APIs.

**Tech Stack:** Electron, React, TypeScript, Tailwind, Radix/shadcn-style primitives, Vitest

---

### Task 1: Rule And Task Type Expansion

**Files:**
- Modify: `src/shared/types.ts`
- Modify: `src/main/store.ts`
- Test: `src/shared/organizer.test.ts`

**Step 1: Write failing tests**
- Add tests for `all` match mode, excluded keywords, extension filters, and rule sorting behavior.

**Step 2: Run test to verify it fails**
- Run: `npm test`

**Step 3: Write minimal implementation**
- Extend `RuleConfig`, task progress types, undo types, and default persisted settings.

**Step 4: Run test to verify it passes**
- Run: `npm test`

### Task 2: Suggestion And Organizer Logic

**Files:**
- Modify: `src/shared/field-suggestions.ts`
- Modify: `src/shared/organizer.ts`
- Modify: `src/shared/field-suggestions.test.ts`
- Create: `src/shared/organizer.test.ts`

**Step 1: Write failing tests**
- Add cases for smarter token extraction, date/noise suppression, extension filtering, exclusion matching, and `all` matching.

**Step 2: Run test to verify it fails**
- Run: `npm test`

**Step 3: Write minimal implementation**
- Improve field extraction and rule matching logic.

**Step 4: Run test to verify it passes**
- Run: `npm test`

### Task 3: Main Process Long-Running Jobs

**Files:**
- Modify: `src/main/organizer-service.ts`
- Modify: `src/main/organizer-service.test.ts`
- Modify: `src/main/ipc.ts`
- Modify: `src/preload/index.ts`

**Step 1: Write failing tests**
- Add service tests for progress callbacks, cancellation, undo last run, and import/export helpers.

**Step 2: Run test to verify it fails**
- Run: `npm test`

**Step 3: Write minimal implementation**
- Add progress-aware scanning and execution, cancel support, undo support, and IPC event plumbing.

**Step 4: Run test to verify it passes**
- Run: `npm test`

### Task 4: Renderer Refactor And Workflow UX

**Files:**
- Create: `src/renderer/src/components/app-shell.tsx`
- Create: `src/renderer/src/components/dialogs/rule-editor-dialog.tsx`
- Create: `src/renderer/src/components/dialogs/confirm-dialog.tsx`
- Create: `src/renderer/src/components/drop-path-field.tsx`
- Create: `src/renderer/src/components/progress-panel.tsx`
- Create: `src/renderer/src/components/rule-insights.tsx`
- Create: `src/renderer/src/pages/home-page.tsx`
- Create: `src/renderer/src/pages/rules-page.tsx`
- Create: `src/renderer/src/pages/guide-page.tsx`
- Create: `src/renderer/src/lib/rule-insights.ts`
- Modify: `src/renderer/src/App.tsx`

**Step 1: Write failing tests**
- Add pure utility tests for duplicate detection and any new reducer/helper logic.

**Step 2: Run test to verify it fails**
- Run: `npm test`

**Step 3: Write minimal implementation**
- Split the renderer, add progress and cancel UX, undo entry point, search/filter/import/export for rules, and stronger page flow.

**Step 4: Run test to verify it passes**
- Run: `npm test`

### Task 5: Stronger Visual System And Branding

**Files:**
- Modify: `src/renderer/src/styles.css`
- Modify: `src/renderer/src/components/ui/button.tsx`
- Modify: `src/renderer/src/components/ui/card.tsx`
- Modify: `src/renderer/src/components/ui/input.tsx`
- Modify: `src/renderer/src/components/ui/textarea.tsx`
- Modify: `src/renderer/src/components/ui/tabs.tsx`
- Create: `src/renderer/src/components/brand-mark.tsx`
- Create: `build/icon.ico`
- Modify: `package.json`

**Step 1: Write failing tests**
- No direct visual snapshot tests; use build/typecheck as the verification gate for this task.

**Step 2: Run test to verify it fails**
- Skip targeted red step for visual styling only.

**Step 3: Write minimal implementation**
- Introduce a stronger visual language, brand mark, page hero sections, and packaging icon.

**Step 4: Run test to verify it passes**
- Run: `npm run build`

### Task 6: Final Verification And Packaging

**Files:**
- Modify: `README.md`

**Step 1: Verify behavior**
- Run: `npm test`
- Run: `npm run typecheck`
- Run: `npm run build`
- Run: `npm run dist`

**Step 2: Update docs**
- Document undo, progress/cancel, advanced rules, and import/export.

**Step 3: Commit**
- Commit after verification with a summary message for v1.1.
