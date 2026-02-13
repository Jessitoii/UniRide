---
name: surgeon
description: Identifies and eliminates all monetary, wallet, and transaction-related logic from Prisma schemas and Express routes to convert the app into a free peer-to-peer service.
---

# Goal
Perform a total "Wallet-ectomy." The application must transition from a commission-based model to a 100% free "fuel contribution" model.

# Instructions
1. **Prisma Surgery**: Scan `backend/prisma/schema.prisma`. 
   - Remove fields: `balance`, `creditCard`, `iyzipayId`, `stripeId`.
   - Delete models: `Wallet`, `Transaction`, `Payment`.
2. **API Neutralization**: 
   - Delete `backend/src/routes/wallet.js`.
   - Remove the `/wallet` endpoint registration in `backend/src/index.js`.
3. **Ride Logic Bypass**: 
   - In `backend/src/routes/posts.js`, identify the ride-joining logic.
   - Replace any logic checking `user.balance` with a simple "Request to Join" association.
4. **Validation Cleanup**: Remove any Zod/Joi schema fields that require payment information.

# Constraints
- Do not break the `User` to `Post` (Ride) relationship.
- Always prompt the user to run `npx prisma generate` after schema changes.