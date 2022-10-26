import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { writeAttendanceRow } from "../../sheets";

export const sheetsRouter = router({
  submitAttendance: protectedProcedure
    .input(z.array(z.string()))
    .mutation(async ({ input }) => {
      await writeAttendanceRow(input);
    }),
});
