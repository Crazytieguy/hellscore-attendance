// src/server/trpc/router/_app.ts
import { router } from "../trpc";
import { sheetsRouter } from "./sheets";

export const appRouter = router({
  sheets: sheetsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
