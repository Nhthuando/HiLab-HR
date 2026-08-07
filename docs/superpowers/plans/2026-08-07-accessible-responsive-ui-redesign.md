# Accessible Responsive UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make HiLab-HR’s existing UI responsive and keyboard/screen-reader accessible without changing its current light glassmorphism visual system or product behaviour.

**Architecture:** Keep route pages and state ownership unchanged. Add two small client-side UI primitives: the Navbar gains local state for the mobile dropdown; a new `ModalDialog` component owns focus containment and dialog semantics for the three existing Skill Studio confirmation flows. Existing pages receive semantic wiring, responsive Tailwind classes, and audited colour-token changes only.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Lucide React, agent-browser + axe-core runtime audit.

## Global Constraints

- Preserve the current glass-panel/glass-card treatment, light stone surfaces, and indigo/violet accents.
- Do not alter API endpoints, `SkillConfig`, persistence, Gemini integration, or screening behaviour.
- Add no production or development dependencies.
- Maintain Vietnamese UI copy and provide Vietnamese accessible names.
- Meet WCAG 2.2 AA for the previously failed normal-text contrast and form-control naming checks.
- Reflect UI requirements, architecture, tasks, and verification in `docs/features/hr-cv-screening/` and `docs/architecture.md`.
- Run `npm run lint` and `npm run build` before completion.

---

## File Structure

- Create: `hilab-hr/src/components/ModalDialog.tsx` — reusable client dialog primitive with focus management and keyboard handling.
- Modify: `hilab-hr/src/components/Navbar.tsx` — accessible mobile navigation dropdown.
- Modify: `hilab-hr/src/components/SkillSelector.tsx` — stable accessible name for the screening Skill selector.
- Modify: `hilab-hr/src/app/analyze/page.tsx` — associate the single-CV file upload with its visible label.
- Modify: `hilab-hr/src/app/analyze/batch/page.tsx` — associate the batch-CV file upload with its visible label.
- Modify: `hilab-hr/src/app/page.tsx` — correct the two audited code-example contrast failures.
- Modify: `hilab-hr/src/app/skills/page.tsx` — responsive header, named controls, contrast, correct heading order, and `ModalDialog` integration.
- Modify: `docs/features/hr-cv-screening/{spec.md,plan.md,tasks.md,test-plan.md}` and `docs/architecture.md` — Spec-Driven requirements, decision, tracking, and regression coverage.

## Task 1: Implement the reusable accessible modal primitive

**Files:**

- Create: `hilab-hr/src/components/ModalDialog.tsx`

**Interfaces:**

- Consumes: a visible title element supplied by the caller and an optional initial-focus ref.
- Produces: `ModalDialog({ titleId, onClose, initialFocusRef, children })`, a client component that renders an accessible modal overlay.

- [ ] **Step 1: Define the public props and focusable selector**

```tsx
export interface ModalDialogProps {
  titleId: string;
  onClose: () => void;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');
```

- [ ] **Step 2: Add focus capture, initial focus, and focus restoration**

```tsx
const dialogRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const returnFocusTarget = document.activeElement as HTMLElement | null;
  const frame = requestAnimationFrame(() => initialFocusRef?.current?.focus());

  return () => {
    cancelAnimationFrame(frame);
    returnFocusTarget?.focus();
  };
}, [initialFocusRef]);
```

- [ ] **Step 3: Add Escape closing and Tab/Shift+Tab containment**

```tsx
useEffect(() => {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable.at(-1)!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  document.addEventListener('keydown', onKeyDown);
  return () => document.removeEventListener('keydown', onKeyDown);
}, [onClose]);
```

- [ ] **Step 4: Render the existing visual shell with dialog semantics**

```tsx
return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="w-full max-w-md overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-2xl animate-in zoom-in-95 duration-150"
    >
      {children}
    </div>
  </div>
);
```

- [ ] **Step 5: Type-check the isolated component**

Run: `npm run lint -- src/components/ModalDialog.tsx`

Expected: ESLint completes with no errors.

- [ ] **Step 6: Commit the primitive**

```bash
git add hilab-hr/src/components/ModalDialog.tsx
git commit -m "feat(ui): add accessible modal dialog"
```

## Task 2: Restore mobile primary navigation

**Files:**

- Modify: `hilab-hr/src/components/Navbar.tsx:1-84`

**Interfaces:**

- Consumes: the current `navLinks` entries and `usePathname()`.
- Produces: a desktop navigation unchanged at `md` and above, plus a mobile menu toggle and dropdown below `md`.

- [ ] **Step 1: Add the client state and icon imports**

```tsx
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
const mobileMenuId = 'primary-navigation-mobile';
```

- [ ] **Step 2: Close the mobile menu on route change and Escape**

```tsx
useEffect(() => {
  setIsMobileMenuOpen(false);
}, [pathname]);

useEffect(() => {
  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') setIsMobileMenuOpen(false);
  };
  document.addEventListener('keydown', closeOnEscape);
  return () => document.removeEventListener('keydown', closeOnEscape);
}, []);
```

- [ ] **Step 3: Add the labelled mobile-menu button beside the brand**

```tsx
<button
  type="button"
  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 shadow-xs transition-colors hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 md:hidden"
  aria-label={isMobileMenuOpen ? 'Đóng điều hướng chính' : 'Mở điều hướng chính'}
  aria-controls={mobileMenuId}
  aria-expanded={isMobileMenuOpen}
  onClick={() => setIsMobileMenuOpen((open) => !open)}
>
  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
</button>
```

- [ ] **Step 4: Render the dropdown immediately below the sticky header**

```tsx
{isMobileMenuOpen && (
  <nav id={mobileMenuId} aria-label="Điều hướng chính" className="border-t border-stone-200/80 bg-white/95 p-3 shadow-lg backdrop-blur-md md:hidden">
    <div className="mx-auto grid max-w-7xl gap-1 px-1">
      {navLinks.map(({ href, label, icon: Icon }) => {
        const isActive = href === '/analyze' ? pathname === '/analyze' : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${isActive ? 'border border-indigo-200 bg-indigo-50 text-indigo-700' : 'text-stone-600 hover:bg-stone-100/80 hover:text-stone-900'}`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </div>
  </nav>
)}
```

- [ ] **Step 5: Verify the mobile navigation behaviour in the browser**

Run: `npx.cmd --yes agent-browser --session hilab-hr-ui set viewport 375 812`, then open `/analyze`, open the menu, tab through all four links, press Escape, reopen it, and select `/skills`.

Expected: all primary routes are reachable; Escape closes the dropdown; choosing a route closes the dropdown; the desktop nav remains visible at 1440px.

- [ ] **Step 6: Commit the navigation change**

```bash
git add hilab-hr/src/components/Navbar.tsx
git commit -m "fix(ui): add accessible mobile navigation"
```

## Task 3: Name screening controls and correct home-page contrast

**Files:**

- Modify: `hilab-hr/src/components/SkillSelector.tsx:1-99`
- Modify: `hilab-hr/src/app/analyze/page.tsx:152-219`
- Modify: `hilab-hr/src/app/analyze/batch/page.tsx:175-270`
- Modify: `hilab-hr/src/app/page.tsx:105-109`

**Interfaces:**

- Consumes: the existing `SkillSelector` public props and file-change handlers.
- Produces: labelled native selects and file inputs, with no state or API-contract change.

- [ ] **Step 1: Wire the Skill selector label to the native select**

```tsx
const skillSelectId = useId();

<label htmlFor={skillSelectId} className="text-xs font-bold text-stone-900">
  Bộ Skill / Tiêu chí áp dụng
</label>
<select
  id={skillSelectId}
  value={currentSkill.id}
  onChange={handleChange}
  className="w-full appearance-none rounded-lg border border-indigo-200 bg-white px-3 py-1.5 pr-8 text-xs font-semibold text-indigo-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
>
```

- [ ] **Step 2: Associate each visible CV-upload label with its input**

```tsx
// /analyze
<label htmlFor="single-cv-file" className="block text-sm font-semibold text-stone-800">...</label>
<input id="single-cv-file" type="file" accept=".pdf" onChange={handleFileChange} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />

// /analyze/batch
<label htmlFor="batch-cv-files" className="block text-sm font-semibold text-stone-800">...</label>
<input id="batch-cv-files" type="file" multiple accept=".pdf" onChange={handleFilesChange} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
```

- [ ] **Step 3: Replace only the two failing home-page text colour utilities**

```tsx
<div className="text-stone-600"># Chạy script Python từ Agent:</div>
<div className="text-indigo-700">python analyze_cv.py --cv candidate.pdf --jd jd.md</div>
```

- [ ] **Step 4: Run the focused accessibility scan**

Run: open `/analyze` and `/analyze/batch` at 375px, then run `npx.cmd --yes agent-browser --session hilab-hr-ui a11y --json` on each route and on `/`.

Expected: neither screening route reports `label` or `select-name`; `/` does not report the two audited code-snippet `color-contrast` nodes.

- [ ] **Step 5: Commit the semantic and contrast repairs**

```bash
git add hilab-hr/src/components/SkillSelector.tsx hilab-hr/src/app/analyze/page.tsx hilab-hr/src/app/analyze/batch/page.tsx hilab-hr/src/app/page.tsx
git commit -m "fix(a11y): name screening controls and improve contrast"
```

## Task 4: Make Skill Studio responsive and accessible

**Files:**

- Modify: `hilab-hr/src/app/skills/page.tsx:1-1088`
- Modify: `hilab-hr/src/components/ModalDialog.tsx` only if integration exposes a typed interface gap.

**Interfaces:**

- Consumes: `ModalDialog` from Task 1, existing Skill Studio state and handlers.
- Produces: a non-overflowing header, labelled editor controls, and create/delete/reset dialogs with keyboard-safe focus handling.

- [ ] **Step 1: Restructure only the header’s responsive layout**

```tsx
<div className="max-w-7xl mx-auto flex flex-col gap-3 px-4 py-3.5 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20"><Sparkles className="h-5 w-5" /></div>
      <div className="min-w-0">
        <div className="flex items-center gap-2"><h1 className="text-base font-bold leading-none text-stone-900">HR Skill Studio</h1><span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">AI-Powered</span></div>
        <p className="mt-0.5 text-xs text-stone-500">Tùy biến tiêu chí & trọng số chấm điểm CV</p>
      </div>
    </div>
    <div className="w-full min-w-0 border-stone-200 sm:w-auto sm:border-l sm:pl-4">
      <label htmlFor="studio-preset" className="sr-only">Bộ tiêu chí đang chỉnh sửa</label>
      <select id="studio-preset" value={activeSkill.id} onChange={(event) => handleSelectPreset(event.target.value)} className="w-full min-w-0 truncate rounded-lg border border-stone-300 bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-800 transition-colors hover:bg-stone-200/70 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:min-w-[270px]" />
    </div>
  </div>
  <div className="flex flex-wrap items-center gap-2">{/* existing actions */}</div>
</div>
```

- [ ] **Step 2: Name every audited Studio input and icon-only action**

```tsx
<input id="skill-name" /* existing name-input props */ />
<label htmlFor="skill-name" /* existing visual label classes */>Tên bộ tiêu chí (Preset Name)</label>

<input aria-label="Nhập trọng số Kỹ năng (phần trăm)" type="number" /* existing skills props */ />
<input aria-label="Điều chỉnh trọng số Kỹ năng (phần trăm)" type="range" /* existing skills props */ />

<label htmlFor="copilot-message" className="sr-only">Yêu cầu cho AI Skill Co-pilot</label>
<input id="copilot-message" /* existing chat-input props */ />
<button aria-label="Gửi yêu cầu cho AI Skill Co-pilot" type="submit" disabled={isAiLoading || !chatInput.trim()} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs transition-colors hover:bg-indigo-700 disabled:opacity-50">
```

Add the remaining six explicit labels: `Nhập trọng số Kinh nghiệm (phần trăm)`, `Điều chỉnh trọng số Kinh nghiệm (phần trăm)`, `Nhập trọng số Học vấn (phần trăm)`, `Điều chỉnh trọng số Học vấn (phần trăm)`, `Nhập trọng số Ngoại ngữ (phần trăm)`, and `Điều chỉnh trọng số Ngoại ngữ (phần trăm)`. Give the close actions these exact names: `Đóng hộp thoại tạo bộ tiêu chí`, `Đóng hộp thoại xóa bộ tiêu chí`, `Đóng hộp thoại khôi phục bộ tiêu chí`, and `Đóng thông báo`.

- [ ] **Step 3: Apply the audited contrast and heading corrections**

```tsx
<h2 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">AI Skill Co-pilot ...</h2>
<span className={msg.role === 'user' ? 'text-indigo-100' : 'text-stone-600'}>{msg.timestamp}</span>
<span className="text-stone-600 font-normal">(Tùy chọn)</span>
```

Change each dialog title from `h3` to `h2`, preserve its classes, and assign a stable title id used by `ModalDialog`.

- [ ] **Step 4: Replace each ad-hoc modal shell with `ModalDialog`**

```tsx
const createNameInputRef = useRef<HTMLInputElement>(null);
const deleteCancelButtonRef = useRef<HTMLButtonElement>(null);
const resetCancelButtonRef = useRef<HTMLButtonElement>(null);

{isCreateModalOpen && (
  <ModalDialog titleId="create-skill-dialog-title" onClose={() => setIsCreateModalOpen(false)} initialFocusRef={createNameInputRef}>
    <div className="bg-gradient-to-r from-indigo-50/80 via-white to-white border-b border-stone-200/80 px-5 py-4">
      <h2 id="create-skill-dialog-title" className="text-sm font-bold text-stone-900">Tạo Bộ Tiêu Chí Mới</h2>
    </div>
    <form onSubmit={handleConfirmCreate} className="space-y-4 p-5">
      <div><label htmlFor="new-skill-name" className="mb-1.5 block text-xs font-bold text-stone-800">Tên bộ tiêu chí <span className="text-rose-500">*</span></label><input ref={createNameInputRef} id="new-skill-name" value={newSkillName} onChange={(event) => setNewSkillName(event.target.value)} className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
      <div><label htmlFor="new-skill-description" className="mb-1.5 block text-xs font-bold text-stone-800">Mô tả mục đích <span className="font-normal text-stone-600">(Tùy chọn)</span></label><input id="new-skill-description" value={newSkillDesc} onChange={(event) => setNewSkillDesc(event.target.value)} className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs text-stone-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
      <div className="flex items-center justify-end gap-2.5 border-t border-stone-100 pt-2"><button type="button" onClick={() => setIsCreateModalOpen(false)}>Hủy</button><button type="submit" disabled={!newSkillName.trim()}>Tạo Bộ Tiêu Chí</button></div>
    </form>
  </ModalDialog>
)}
```

Use the corresponding cancel-button ref for delete and reset. Remove `autoFocus` from the create input because the dialog primitive owns initial focus. Each close button calls the same state setter passed to `onClose`.

- [ ] **Step 5: Run mobile, keyboard, and axe regression checks**

Run: at 375px, open `/skills`, verify `#studio-preset` fits inside the viewport, then open Create, Delete, and Reset dialogs. In each modal, verify the first focus target, Tab/Shift+Tab looping, Escape closing, and focus returning to its launcher. Run `a11y --json` afterward.

Expected: no horizontal clipping; focus never reaches page controls while a dialog is open; the Studio scan reports no `button-name`, `label`, `select-name`, `heading-order`, or audited `color-contrast` violations.

- [ ] **Step 6: Commit the Studio remediation**

```bash
git add hilab-hr/src/app/skills/page.tsx hilab-hr/src/components/ModalDialog.tsx
git commit -m "fix(a11y): make Skill Studio keyboard safe"
```

## Task 5: Update Spec-Driven documents and perform release verification

**Files:**

- Modify: `docs/features/hr-cv-screening/spec.md`
- Modify: `docs/features/hr-cv-screening/plan.md`
- Modify: `docs/features/hr-cv-screening/tasks.md`
- Modify: `docs/features/hr-cv-screening/test-plan.md`
- Modify: `docs/architecture.md`

**Interfaces:**

- Consumes: the completed UI behaviour from Tasks 1-4.
- Produces: documentation that defines the responsive/accessibility contract and test evidence required for future UI changes.

- [ ] **Step 1: Add the product requirement to the feature spec**

Add `FR-5: Responsive & Accessible Interaction` specifying a mobile dropdown below 768px, 375px-safe Studio layout, labelled native controls, WCAG AA audited contrast, and keyboard-safe dialog requirements.

- [ ] **Step 2: Record the implementation decision**

Add `ADR-04: Shared Accessible UI Primitives` to `plan.md`, documenting local React/Tailwind primitives instead of a new UI dependency, with Navbar state and `ModalDialog` as the boundary owners.

- [ ] **Step 3: Update implementation tracking**

Add a completed Phase 6 in `tasks.md` with entries for mobile navigation, control semantics, dialog focus behaviour, contrast/heading corrections, and responsive verification.

- [ ] **Step 4: Add concrete acceptance cases to the test plan**

Append:

```markdown
### TC-06: Mobile navigation
At 375px, open the dropdown from every route; verify all four destinations are reachable and Escape closes it.

### TC-07: Skill Studio modal keyboard flow
Open Create, Delete, and Reset; verify focus enters the dialog, cycles within it, Escape closes it, and focus returns to the original launcher.

### TC-08: Accessibility regression
Run axe on `/`, `/analyze`, `/analyze/batch`, `/skills`, and `/history`; verify there are no accessible-name, form-label, heading-order, or audited colour-contrast violations.
```

Update `docs/architecture.md` so the frontend block lists `Navbar Mobile Navigation` and `ModalDialog` as shared UI interaction components.

- [ ] **Step 5: Run static and production validation**

Run: `npm run lint`

Expected: exit code 0.

Run: `npm run build`

Expected: exit code 0 with no TypeScript or production-build errors.

- [ ] **Step 6: Perform final visual inspection**

Run agent-browser screenshots at 375×812 and 1440×900 for `/`, `/analyze`, `/analyze/batch`, `/skills`, and `/history`.

Expected: no horizontal clipping, no overlap, and the existing visual system is unchanged apart from the approved accessibility repairs.

- [ ] **Step 7: Commit documentation and verification updates**

```bash
git add docs/features/hr-cv-screening/spec.md docs/features/hr-cv-screening/plan.md docs/features/hr-cv-screening/tasks.md docs/features/hr-cv-screening/test-plan.md docs/architecture.md
git commit -m "docs: record accessible UI requirements"
```

## Plan Self-Review

- **Spec coverage:** Tasks 2-4 implement every approved design section; Task 5 records each requirement and validation rule.
- **No-placeholder check:** All files, public interfaces, focus rules, semantic names, validation routes, and commands are specified directly.
- **Type consistency:** `ModalDialog` accepts `RefObject<HTMLElement | null>` so create-input and cancel-button refs can be passed without casts; it is only imported by the client-side Skill Studio page.
