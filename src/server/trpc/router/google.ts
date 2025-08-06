import { TRPCError } from "@trpc/server";
import { captureException } from "@sentry/nextjs";

import { router, protectedProcedure } from "../trpc";
import { getSheetContent, writeResponseRow } from "../../googleApis";
import {
  attendanceSchema,
  sanitizeText,
} from "../../../utils/attendanceSchema";

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
          const error = new TRPCError({ code: "UNAUTHORIZED" });
          captureException(error, { extra: { userEmail, userEvents } });
          throw error;
        }

        // Double sanitize text inputs as a safety measure
        const sanitizedWhyNot = sanitizeText(whyNot);
        const sanitizedComments = sanitizeText(comments);

        try {
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
        } catch (error) {
          captureException(error, {
            extra: {
              userEmail,
              eventTitle,
              eventDate,
              going,
              whyNot,
              wentLastTime,
              comments,
              sanitizedWhyNot,
              sanitizedComments,
            },
          });
        }
      }
    ),
});
