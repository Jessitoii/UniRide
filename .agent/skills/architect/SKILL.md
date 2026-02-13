---
name: architect
description: Manages migration from legacy React Navigation patterns to Expo Router (v3+) and enforces a clean, modular project structure.
---

# Goal
Fix the broken navigation tree and ensure the app follows the "file-based routing" standard.

# Instructions
1. **Layout Integrity**: 
   - Ensure `app/_layout.tsx` has a proper `default export`.
   - Implement the `Slot` or `Stack` provider.
2. **Navigation Upgrade**:
   - Identify legacy `navigation.navigate()` calls.
   - Replace with `router.push()` or `router.replace()` from `expo-router`.
3. **Modularization**: 
   - Move business logic (API calls, data fetching) out of `app/(tabs)` and into `src/services` or `src/hooks`.
4. **Tab Cleanup**: Remove the "Wallet" tab from `app/(tabs)/_layout.tsx`.

# Constraints
- No `useEffect` for navigation if a `Link` component can be used instead.
- All routes must be strictly typed.