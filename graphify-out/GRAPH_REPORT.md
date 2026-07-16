# Graph Report - .  (2026-07-10)

## Corpus Check
- Corpus is ~5,466 words - fits in a single context window. You may not need a graph.

## Summary
- 35 nodes · 61 edges · 5 communities
- Extraction: 93% EXTRACTED · 5% INFERRED · 2% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.75)
- Token cost: 82,048 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Page Layout & UI Chrome|Page Layout & UI Chrome]]
- [[_COMMUNITY_Animation & 3D Engine|Animation & 3D Engine]]
- [[_COMMUNITY_Registration & Payments|Registration & Payments]]
- [[_COMMUNITY_Brand & Competition|Brand & Competition]]
- [[_COMMUNITY_Legal & Footer Nav|Legal & Footer Nav]]

## God Nodes (most connected - your core abstractions)
1. `FIXUP ARENA Landing Page (index.html)` - 15 edges
2. `Hero Section` - 8 edges
3. `navigateTo() SPA Router` - 8 edges
4. `GSAP 3.12.2` - 6 edges
5. `Global Footer` - 5 edges
6. `Scroll-Triggered Animations (pinned carousel, camera fly)` - 5 edges
7. `FixUp Arena (Brand)` - 4 edges
8. `Support Center / FAQ Page` - 4 edges
9. `Register Team Entry Option (£70, Stripe)` - 4 edges
10. `Stripe Payment / Checkout` - 4 edges

## Surprising Connections (you probably didn't know these)
- `FIXUP ARENA Landing Page (index.html)` --references--> `Lenis Smooth Scroll`  [AMBIGUOUS]
  index.html → index.html  _Bridges community 0 → community 1_
- `FIXUP ARENA Landing Page (index.html)` --references--> `FixUp Arena (Brand)`  [EXTRACTED]
  index.html → index.html  _Bridges community 0 → community 3_
- `FIXUP ARENA Landing Page (index.html)` --references--> `Global Footer`  [EXTRACTED]
  index.html → index.html  _Bridges community 0 → community 4_
- `FIXUP ARENA Landing Page (index.html)` --references--> `Hero Section`  [EXTRACTED]
  index.html → index.html  _Bridges community 0 → community 2_
- `Terms of Service Page` --references--> `K² Foundry (Parent/Developer Entity)`  [EXTRACTED]
  index.html → index.html  _Bridges community 3 → community 4_

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Visual Experience Tech Stack** — index_threejs, index_gsap, index_scrolltrigger, index_webgl_background, index_scroll_animations [EXTRACTED 1.00]
- **Tournament Entry & Payment Flow** — index_register_team, index_join_solo, index_stripe, index_registration_flow, index_500_prize [EXTRACTED 1.00]
- **SPA Router & Legal/Support Views** — index_spa_router, index_privacy_policy, index_terms_of_service, index_support_faq, index_navigation [EXTRACTED 1.00]

## Communities (5 total, 0 thin omitted)

### Community 0 - "Page Layout & UI Chrome"
Cohesion: 0.27
Nodes (10): Get In Touch / Contact Section, Custom Cursor, FIXUP ARENA Landing Page (index.html), Glass Panel Design Component, Google Fonts (Inter) + Geist Sans, Iconify Icon Web Component, Fixed Nav Bar + Mobile Menu, The Mission / Problem Section (+2 more)

### Community 1 - "Animation & 3D Engine"
Cohesion: 0.33
Nodes (7): Character Reveal Text Animation, GSAP 3.12.2, Lenis Smooth Scroll, Scroll-Triggered Animations (pinned carousel, camera fly), GSAP ScrollTrigger, Three.js (r128), 3D WebGL Particle Background (Stadium + Helix)

### Community 2 - "Registration & Payments"
Cohesion: 0.43
Nodes (7): Hero Section, Join as Solo Entry Option (£10, Stripe), Preloader / Loading Screen, Register Team Entry Option (£70, Stripe), Registration Flow (Pay → Email → Submit Roster), Stripe Payment / Checkout, Supabase Storage (Brand Image Assets)

### Community 3 - "Brand & Competition"
Cohesion: 0.33
Nodes (6): £500 Cash Prize Pool, Brand Palette (Cyan #5de0e6 / Blue #004aad), FixUp Arena (Brand), K² Foundry (Parent/Developer Entity), 7-A-Side Football Tournament (14th Feb, Castle Green), Castle Green 3G Pitches (Dagenham)

### Community 4 - "Legal & Footer Nav"
Cohesion: 0.70
Nodes (5): Global Footer, Privacy Policy Page, navigateTo() SPA Router, Support Center / FAQ Page, Terms of Service Page

## Ambiguous Edges - Review These
- `FIXUP ARENA Landing Page (index.html)` → `Lenis Smooth Scroll`  [AMBIGUOUS]
  index.html · relation: references

## Knowledge Gaps
- **2 isolated node(s):** `The Mission / Problem Section`, `Google Fonts (Inter) + Geist Sans`
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `FIXUP ARENA Landing Page (index.html)` and `Lenis Smooth Scroll`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `FIXUP ARENA Landing Page (index.html)` connect `Page Layout & UI Chrome` to `Animation & 3D Engine`, `Registration & Payments`, `Brand & Competition`, `Legal & Footer Nav`?**
  _High betweenness centrality (0.510) - this node is a cross-community bridge._
- **Why does `Hero Section` connect `Registration & Payments` to `Page Layout & UI Chrome`, `Animation & 3D Engine`, `Brand & Competition`, `Legal & Footer Nav`?**
  _High betweenness centrality (0.282) - this node is a cross-community bridge._
- **Why does `navigateTo() SPA Router` connect `Legal & Footer Nav` to `Page Layout & UI Chrome`, `Animation & 3D Engine`, `Registration & Payments`?**
  _High betweenness centrality (0.160) - this node is a cross-community bridge._
- **What connects `The Mission / Problem Section`, `Google Fonts (Inter) + Geist Sans`, `Custom Cursor` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._