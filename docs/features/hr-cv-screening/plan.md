# Architecture Decisions & Implementation Plan: HR Skill Studio

- **Feature**: HR Skill Studio & Dynamic CV Screening
- **Tech Stack**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Google Gemini 3.1 Flash Lite (`@google/genai`), Prisma / LocalStorage.

---

## 1. Architectural Decision Records (ADRs)

### ADR-01: Dynamic Prompt Composition over Static Prompting
- **Context**: Currently `gemini.ts` uses static string templates with fixed 35/30/20/15 weights.
- **Decision**: Decouple the prompt builder into modular functions accepting `SkillConfig`. The default skill is loaded from `.agents/skills/hr-cv-screening/` at runtime or bundled defaults.
- **Consequences**: Zero breaking changes to existing analysis while enabling full customization.

### ADR-02: AI Co-pilot for Natural Language Skill Refinement
- **Context**: Users want to edit complex rubrics and weights through natural conversation rather than manually editing long prompt strings.
- **Decision**: Implement `/api/skills/ai-edit` powered by Gemini 3.1 Flash Lite with a structured JSON schema output ensuring returned skill configs are always valid, balanced to 100%, and well-formatted.

### ADR-03: Hybrid Storage Strategy
- **Context**: Support both unauthenticated/local browser users and persistent database users seamlessly.
- **Decision**: Store custom presets in `localStorage` with export/sync options to Neon PostgreSQL (Prisma).
