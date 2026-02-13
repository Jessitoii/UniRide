---
name: designer
description: Enforces a high-fidelity Lyft-inspired design system across all React Native components. Utilizes visual resources and strict design tokens to ensure a professional, minimalist, and high-contrast user experience.
---

# Goal
Transform the "KampüsRoute" frontend into a professional-grade application that mimics the UX/UI standards of top-tier ride-sharing platforms like Lyft. Eliminate hardcoded styles in favor of a centralized, scalable design system.

# Design Resources
- **Reference Material**: Reference screenshots of the Lyft UI are located in `.agent/skills/designer/resources/`. 
- **Agent Protocol**: Before modifying any `.tsx` file in the `app/` or `components/` directory, analyze these screenshots to understand spacing, typography hierarchy, and color contrast.

# Technical Specifications (The Lyft Standard)

## 1. Color Palette & Design Tokens
- **Primary Accent**: High-contrast Lyft Pink/Purple (`#FF00BF` or similar) for primary actions and brand highlights.
- **Surface Colors**: Pure White (`#FFFFFF`) for light mode; Deep Charcoal/Black (`#121212`) for dark mode. Avoid "muddy" greys.
- **Semantic Colors**: 
  - Success: `#2DB83D`
  - Error: `#D92E2E`
  - Warning: `#F2A100`

## 2. Typography Hierarchy
- **Primary Font**: San-Serif (Inter or System Default).
- **Headings**: `fontWeight: '800'` or `'bold'`. Destination names and user names must stand out.
- **Body**: `fontWeight: '400'`, high line-height for legibility.
- **Micro-copy**: Secondary labels should use a muted grey with clear readability.

## 3. Atomic Component Standards
- **Ride Cards**: 
  - `borderRadius`: 20px.
  - `padding`: 16px to 20px.
  - `shadow`: Minimalist elevation (Android) or soft blur shadows (iOS).
  - Use clear vertical timeline indicators for pick-up and drop-off points.
- **Action Buttons (CTAs)**: 
  - Full-width with a height of at least 56px.
  - Bold, centered text.
  - Primary buttons must use the Brand Accent color.
- **Input Fields**: 
  - Minimalist borders or underline-only styles.
  - Large touch targets (min 48px height).
  - Use clear icons for "Search," "Home," and "Work" locations.

## 4. Map & Spatial UX
- **Markers**: Replace default pins with the custom assets found in `./assets/images/map-marker.png`.
- **Clutter Reduction**: Hide unnecessary POIs (Points of Interest) on the map component to focus purely on the route.
- **Bottom Sheets**: Use `gorhom/react-native-bottom-sheet` (or equivalent) for ride details and location selection to maximize map visibility.

# Implementation Instructions
1. **Style Extraction**: Identify inline styles in `components/` and move them to a centralized theme file at `src/styles/theme.ts`.
2. **Branding Audit**: Ensure no "Taxi" related iconography remains. Replace with "Ride" or "Route" icons.
3. **Visual Verification**: Cross-reference every layout change with the provided screenshots in the `/resources` folder. If a component looks "cluttered," increase padding and simplify the hierarchy.

# Constraints
- **Zero Inline Styles**: Do not permit hardcoded hex codes or padding values in functional components.
- **Performance First**: Prioritize layout stability; avoid heavy animations that could trigger Worklet errors during the transition phase.