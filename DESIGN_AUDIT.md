# Design Audit

## Task
- Requested change: перенос девяти HTML-макетов в единое спортивное React MVP.
- Task type: C, D и E — новые страницы, гармонизация и выделение дизайн-системы.
- Target routes: публичные, `/app/*`, `/admin/*`.
- Adjacent components: landing, dashboard shell, cards, tables, charts, filters, forms.

## Layout
- Main containers: 1280–1440 px landing; dashboard content занимает остаток после sidebar.
- Gutters: 16 px mobile, 24 px desktop; section cadence 20–32 px.
- Grid: 12-column dashboards, 2–4-column card grids, dense metric strips.
- Density: medium landing, compact dashboard.

## Typography
- H1: Geist-like grotesk, 32–56 px, tight tracking.
- H2/H3: 18–32 px, semibold; body 14–16 px.
- Labels and metrics: uppercase monospace, 11–13 px.
- Links: muted by default, green on active/hover.

## Colors, shape and depth
- Backgrounds: `#0d0f0e`, `#121413`, `#1a1c1b`, `#1e201f`, `#282a29`.
- Primary: `#37e787`/`#8affaf`; secondary: `#e4c277`; errors: `#ff8177`.
- Cards use 1 px borders, 8–12 px radii and restrained shadows.
- Separation relies on borders and surface contrast, not floating shadows.

## Components and media
- Primary buttons are solid green with dark text; secondary buttons are dark bordered controls.
- Cards, badges, segmented tabs and dense tables repeat across every dashboard.
- Icons are thin outlined symbols; avatars and logos use compact square/circle frames.
- Charts and the map are schematic telemetry visuals rather than decorative illustrations.

## Motion and responsive behavior
- 150–200 ms color/border transitions; no large transforms.
- Sidebar becomes an accessible mobile drawer below 1024 px.
- Grids stack at 768/1024 px; tables gain horizontal scroll or card presentation.
- Heading and section spacing compress on mobile without changing hierarchy.

## Code conventions
- React functional components, strict TypeScript, shared tokens, composition over copied markup.
- Tailwind is compiled locally; semantic component classes live in `index.css`.
- Shared shells and primitives precede page-specific components.
- Prohibited: CDN Tailwind, remote images, `href="#"`, inline DOM mutation, hidden global scrollbar.

## Dominant pattern summary
1. Near-black layered surfaces with a single bright-green action color.
2. Gold is reserved for levels, ranks and rewards.
3. Monospace uppercase labels frame metrics and telemetry.
4. Cards use compact padding and tight radii.
5. Data hierarchy comes from alignment and contrast rather than decoration.
6. Sidebar and topbar are shared application chrome.
7. Active navigation uses a green surface and explicit `aria-current`.
8. Charts and maps remain schematic and data-led.
9. Mobile stacks content and replaces fixed navigation with a drawer.
10. New sports terminology must not alter the visual hierarchy.

## Closest pattern families and drift risks
- Families: dashboard panel, data summary row, card listing, table, form drawer, landing CTA.
- Preserve: palette, typography rhythm, compact controls, telemetry labels, grid cadence.
- Safe variation: sports copy, domain icons, responsive stacking, data values.
- Risks: over-dense mobile UI, copied one-off shells, mixed IT/sports language.
- Mitigation: shared layouts, central vocabulary and responsive component primitives.

