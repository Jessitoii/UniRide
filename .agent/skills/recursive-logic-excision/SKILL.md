---
name: recursive-logic-excision
description: Performs deep dependency tracing to eliminate monetary, wallet, and transaction-related logic from Prisma schemas and Express routes.
---

# Goal
Convert the commercial "Kampüs Taxi" engine into a free-to-use "KampüsRoute" peer-to-peer system.

# Instructions
1. **Schema Surgery**: Scan `prisma/schema.prisma`. Remove `balance`, `creditCard`, and all `Transaction` models. 
2. **API Cleanup**: Delete `backend/src/routes/wallet.js` and remove its registration in `index.js`.
3. **Association Logic**: In ride-joining endpoints, replace financial validation with a simple seat availability check.

# Constraints
- Never delete the `User` or `Post` models, only their financial fields.
- Trigger a reminder for `npx prisma generate` after any change.