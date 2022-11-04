// src/server/trpc/router/_app.ts
import { router } from "../trpc";
import { googleRouter } from "./google";

export const appRouter = router({
  google: googleRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
