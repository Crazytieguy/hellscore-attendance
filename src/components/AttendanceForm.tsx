import { InferGetStaticPropsType } from "next";
import { trpc } from "../utils/trpc";
import { Session } from "next-auth";
import { useEffect, useMemo } from "react";
import { attendanceSchema, sanitizeText } from "../utils/attendanceSchema";
import { getStaticProps } from "../pages/index";
import { useForm, UseFormProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/router";
import { useSnackbar } from "notistack";

function useZodForm<TSchema extends z.ZodType>(
  props: Omit<UseFormProps<TSchema["_input"]>, "resolver"> & {
    schema: TSchema;
  }
) {
  const form = useForm<TSchema["_input"]>({
    ...props,
    resolver: zodResolver(props.schema, undefined),
  });

  return form;
}

const AttendanceForm = ({
  calendarData,
  userEvents,
  session,
}: InferGetStaticPropsType<typeof getStaticProps> & { session: Session }) => {
  const submitRow = trpc.google.submitAttendance.useMutation();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { handleSubmit, watch, register, formState, setValue } = useZodForm({
    schema: attendanceSchema,
  });
  const relevantTitles = useMemo(
    () =>
      userEvents
        .filter(({ email }) => email === session.user?.email)
        .map(({ title }) => title),
    [userEvents, session]
  );
  const relevantEvents = useMemo(
    () => calendarData.filter(({ title }) => relevantTitles.includes(title)),
    [calendarData, relevantTitles]
  );
  const sortedRelevantTitles = useMemo(
    () => [...new Set(relevantEvents.map(({ title }) => title))],
    [relevantEvents]
  );
  const relevantDates = relevantEvents
    .filter(({ title }) => title === (watch("eventTitle") || sortedRelevantTitles[0]))
    .map(({ start }) => start);
  const nextDate = relevantDates[0];
  useEffect(() => {
    if (nextDate) setValue("eventDate", nextDate);
  }, [setValue, nextDate]);
  const showWhyNot = !watch("going");
  if (!relevantTitles.length) {
    return <p>No relevant events for you!</p>;
  }
  if (formState.isSubmitting || formState.isSubmitted) {
    return <h2 className="animate-spin text-center text-3xl">👻</h2>;
  }
  return (
    <form
      className="form-control mx-auto items-start gap-4 text-xl"
      onSubmit={handleSubmit(async (values) => {
        try {
          // Sanitize text inputs before submission
          const sanitizedValues = {
            ...values,
            whyNot: sanitizeText(values.whyNot),
            comments: sanitizeText(values.comments)
          };
          
          await submitRow.mutateAsync(sanitizedValues);
          enqueueSnackbar("Form submitted successfully!", { variant: "success" });
          router.push("/thank-you");
        } catch (error) {
          enqueueSnackbar("Failed to submit the form.", { variant: "error" });
        }
      })}
    >
      <label>
        <div className="pb-2">אירוע</div>
        <select
          className="select-bordered select"
          {...register("eventTitle", { required: true })}
        >
          {sortedRelevantTitles.map((title) => (
            <option value={title} key={title}>
              {title}
            </option>
          ))}
        </select>
      </label>
      <label>
        <div className="pb-2">תאריך</div>
        <select
          className="select-bordered select"
          {...register("eventDate", { required: true })}
        >
          {relevantDates.map((date) => (
            <option value={date} key={date}>
              {date}
            </option>
          ))}
        </select>
      </label>
      <label className="cursor-pointer">
        <div className="pb-2">האם את/ה מגיע/ה?</div>
        <input type="checkbox" className="toggle" {...register("going")} />
      </label>
      <label className="cursor-pointer">
        <div className="pb-2">האם הגעת פעם שעברה?</div>
        <input
          type="checkbox"
          className="toggle"
          {...register("wentLastTime")}
        />
      </label>
      {showWhyNot && (
        <label>
          <div className="pb-2">נשמח לשמוע למה לא תגיעו 🙂</div>
          <input
            className="input-bordered input"
            {...register("whyNot")}
          ></input>
        </label>
      )}
      <label>
        <div className="pb-2">הערות נוספות?</div>
        <input
          className="input-bordered input"
          {...register("comments")}
        ></input>
      </label>
      <button className="btn self-center px-20">שלח/י טופס</button>
    </form>
  );
};

export default AttendanceForm;
