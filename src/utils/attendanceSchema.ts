import { z } from "zod";

export const attendanceSchema = z.object({
  eventTitle: z.string(),
  eventDate: z.string(),
  going: z.boolean(),
  whyNot: z.string().optional(),
  wentLastTime: z.boolean(),
  comments: z.string().optional(),
});
