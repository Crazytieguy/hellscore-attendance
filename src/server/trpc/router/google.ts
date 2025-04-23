import { router, protectedProcedure } from "../trpc";
import { getSheetContent, writeResponseRow } from "../../googleApis";
import { TRPCError } from "@trpc/server";
import { attendanceSchema, sanitizeText } from "../../../utils/attendanceSchema";

export const googleRouter = router({
  submitAttendance: protectedProcedure
    .input(attendanceSchema)
    .mutation(
      async ({
        input: { eventTitle, eventDate, going, whyNot, wentLastTime, comments },
        ctx,
      }) => {
        const userEmail = ctx.session.user.email;
        if (!userEmail) {
          throw new Error("user has no email");
        }
        const userEvents = await getSheetContent();
        if (
          !userEvents.some(
            ({ title, email }) => userEmail === email && eventTitle === title
          )
        ) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        
        // Double sanitize text inputs as a safety measure
        const sanitizedWhyNot = sanitizeText(whyNot);
        const sanitizedComments = sanitizeText(comments);
        
        await writeResponseRow([
          userEmail,
          Date.now().toString(),
          eventTitle,
          eventDate,
          going ? "TRUE" : "FALSE",
          sanitizedWhyNot,
          wentLastTime ? "TRUE" : "FALSE",
          sanitizedComments,
        ]);
      }
    ),
});
