import { Auth, calendar_v3, google } from "googleapis";
import { z } from "zod";
import { env } from "../env/server.mjs";
import { nowISO } from "../utils/dates";

const auth = google.auth.fromJSON(
  JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS)
) as Auth.JWT & { scopes: string[] };

auth.scopes = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/calendar.readonly",
];
const sheets = google.sheets({ version: "v4", auth });
const calendars = google.calendar({ version: "v3", auth });

const isTest = process.env.TEST_EVENTS === "true" || process.env.TEST_EVENTS === "1";

export const writeResponseRow = async (
  row: (string | boolean | number)[],
  {
    retry = true,
    maxRetries = 3,
  }: {
    retry?: boolean;
    maxRetries?: number;
  } = {}
) => {
  // Maximum number of retry attempts
  let attempt = 0;

  while (attempt < (retry ? maxRetries : 1)) {
    try {
      // Exponential backoff delay on retries
      if (attempt > 0) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        await new Promise((resolve) => setTimeout(resolve, delay));
        console.log(`Retry attempt ${attempt} after ${delay}ms delay`);
      }

      attempt++;

      return await sheets.spreadsheets.values.append({
        spreadsheetId: env.TEST_EVENTS ? env.TEST_SHEET_ID : env.SHEET_ID,
        requestBody: { values: [row] },
        range: "response",
        valueInputOption: "USER_ENTERED",
      });
    } catch (error: any) {
      console.error(
        `Error writing to sheet (attempt ${attempt}/${maxRetries}):`,
        error
      );

      // If we've exhausted retries, throw the error
      if (attempt >= maxRetries) {
        throw error;
      }

      // Check if this is a rate limit error or temporary failure
      const isRetryableError =
        error?.response?.status === 429 || // Rate limit
        error?.response?.status === 500 || // Server error
        error?.message?.includes("quota") ||
        error?.message?.includes("rate limit");

      // If it's not a retryable error, don't retry
      if (!isRetryableError) {
        throw error;
      }
    }
  }
};

const gsheetDataSchema = z.object({
  spreadsheetId: z.string(),
  valueRanges: z.tuple([
    z.object({
      values: z.array(z.tuple([z.string()])),
    }),
    z.object({
      values: z.array(z.tuple([z.string().email()])),
    }),
  ]),
});

export const getSheetContent = async (): Promise<
  Array<{
    title: string;
    email?: string;
    isTest?: boolean;
  }>
> => {
  // If test events are enabled, include test data
  if (isTest) {
    // Get the actual sheet data first
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: env.TEST_SHEET_ID,
      ranges: ["user_event_event_title", "user_event_user_email"],
    });

    const data = gsheetDataSchema.parse(response.data);
    const regularEvents = data.valueRanges[0].values.map((row, i) => ({
      title: row[0],
      email: data.valueRanges[1].values[i]?.[0],
    }));

    const testEvents = [
      { title: "Test Event", isTest: true },
      { title: "Test Event 2", isTest: true },
    ];

    // Combine and return all events
    return [...regularEvents, ...testEvents];
  }

  // Regular behavior when test events are not enabled
  const response = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: env.SHEET_ID,
    ranges: ["user_event_event_title", "user_event_user_email"],
  });
  const data = gsheetDataSchema.parse(response.data);
  return data.valueRanges[0].values.map((row, i) => ({
    title: row[0],
    email: data.valueRanges[1].values[i]?.[0],
  }));
};

interface EventResponse extends calendar_v3.Schema$Event {
  isTest?: boolean;
}

// recurringEventId
export const getHellscoreEvents = async (): Promise<EventResponse[]> => {
  if (isTest) {
    const testEvents: EventResponse[] = [
      {
        id: "1",
        start: {
          dateTime: new Date(
            new Date().getTime() + 60 * 60 * 1000
          ).toISOString(),
          timeZone: "Europe/Berlin",
        },
        end: {
          dateTime: new Date(
            new Date().getTime() + 2 * 60 * 60 * 1000
          ).toISOString(),
          timeZone: "Europe/Berlin",
        },
        summary: "Test Event",
        description: "This is a test event",
        location: "Test Location",
        status: "confirmed",
        isTest: true,
      },
      {
        id: "2",
        start: {
          dateTime: "2023-10-02T14:00:00+02:00",
          timeZone: "Europe/Berlin",
        },
        end: {
          dateTime: "2023-10-02T16:00:00+02:00",
          timeZone: "Europe/Berlin",
        },
        summary: "Test Event 2",
        description: "This is another test event",
        location: "Test Location 2",
        status: "confirmed",
        isTest: true,
      },
    ];
    return testEvents;
  }
  const response = await calendars.events.list({
    calendarId: "6bo68oo6iujc4obpo3fvanpd24@group.calendar.google.com",
    maxAttendees: 1,
    maxResults: 20,
    orderBy: "startTime",
    singleEvents: true,
    timeMin: nowISO(),
  });
  const items = response.data.items;
  if (!items) {
    throw new Error("No items in Hellscore calendar???");
  }
  return items;
};
