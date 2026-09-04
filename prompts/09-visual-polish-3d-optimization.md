# Prompt 9 — Visual Polish, 3D Wow Factor, Optimization

```
Do a full polish pass on the CampusOS frontend.

1. Landing/hero touch on the Dashboard home: add a tasteful 3D element using React Three Fiber (e.g. a slowly rotating low-poly campus building or floating abstract shapes with theme-aware colors) OR an embedded Spline scene — lazy-loaded (next/dynamic, ssr: false) so it never blocks page load, with a static fallback. Keep it subtle, not everywhere.
2. Micro-interactions: hover lift on cards, button press scale, animated number counters on stat cards, staggered list entrances, smooth modal spring animations — all via Framer Motion, respecting prefers-reduced-motion.
3. Theme audit: verify every page/component in BOTH themes — dark must stay soft (no pure black, no unreadable grays), light must keep the golden-ratio layout proportions and comfortable contrast (WCAG AA on text).
4. Performance: route-level code splitting already via Next; additionally memoize heavy lists, debounce filter inputs, add loading skeletons anywhere data loads, ensure no layout shift, and confirm a production build (`npm run build`) passes with no errors or type warnings.
5. Responsiveness: check all pages at mobile (375px), tablet (768px), desktop (1440px); fix any overflow/cramped layouts. The timetable grid should become a day-picker list on mobile.
6. Consistency: one spacing scale, one border-radius scale, consistent icon sizes, favicon + page titles ("CampusOS — Rooms" etc.).
Take screenshots or describe verification of both themes across all 7 pages.
```
