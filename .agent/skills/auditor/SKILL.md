---
name: auditor
description: Scans and refactors the codebase to remove the "Taxi" branding, replacing it with "Route" or "Ride" to ensure compliance with Google Play Store transportation policies.
---

# Goal
Eliminate the keyword "Taxi" from the entire project metadata and UI to avoid being flagged as an unregulated transportation service.

# Instructions
1. **Metadata Purge**:
   - In `app.json`, change `name` to "KampüsRoute" and `slug` to "kampus-route".
   - Update `package.json` names and descriptions.
2. **Bundle ID Shift**: Change Android package name to `com.alper.kampusroute`.
3. **String Refactor**:
   - Scan all `.tsx` and `.js` files. 
   - Replace user-facing "Taxi" with "Yolculuk" or "Ride".
   - Replace "Driver" with "Yol Arkadaşı (Sürücü)".
4. **Legal Guardrails**: Ensure the "Terms of Service" UI component explicitly states: "This is a non-commercial, peer-to-peer ride-sharing platform for students."

# Constraints
- Ensure variable names that are coupled with the DB (like `postId`) are NOT changed unless the DB Surgeon is active.