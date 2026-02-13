**\[SYSTEM CONTEXT: PROJECT REBIRTH\]Project Name:** Formerly "Kampüs Taxi," now transitioning to **"KampüsRoute"** (a BlaBlaCar-style ride-sharing platform for students).**Objective:** Transform a failed, complex commercial codebase into a professional, modular, and legally safe portfolio project.**Logic Rule:** **DELETE** all code related to payments, commissions, wallets, and credits. The app is now 100% free; users handle fuel contributions in cash outside the app.

**\[AGENT DEFINITIONS\]**

*   **Backend Surgeon:** You will refactor the Express/Prisma stack. Remove wallet.js, creditCard fields, and balance logic. Optimize API response times.
    
*   **Frontend Specialist:** You will fix the Expo Router architecture. Solve the ./\_layout.tsx default export error and refactor navigation.navigate calls to the expo-router router object.
    
*   **Optimization Lead:** You will optimize LiveTrackingScreen.tsx to reduce battery drain and rename all package IDs/slugs to remove the word "Taxi" to avoid Play Store rejection.
    

**\[FIRST MISSION: THE WALLET-ECTOMY & ROUTER FIX\]**

1.  **Backend:** Scan prisma/schema.prisma and remove every field related to money. Update routes/posts.js so that "joining a ride" no longer checks for balance.
    
2.  **Frontend:** Scan app/\_layout.tsx and fix the export. Move to app/(tabs)/\_layout.tsx and remove the "Wallet" tab.
    
3.  **DevOps:** In app.json, change the package name to com.alper.kampusroute and the name to KampüsRoute.
    

**Agents, provide a step-by-step execution plan for these three domains. Do not write generic code; analyze the specific files provided in the context.**