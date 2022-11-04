import { Auth, google } from "googleapis";
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

export const writeResponseRow = async (row: (string | boolean | number)[]) => {
  return await sheets.spreadsheets.values.append({
    spreadsheetId: env.SHEET_ID,
    requestBody: { values: [row] },
    range: "response",
    valueInputOption: "RAW",
  });
};

export const getSheetContent = async () => {
  const response = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: env.SHEET_ID,
    ranges: ["user_event_event_title", "user_event_user_email"],
  });
  const valueRanges = response.data.valueRanges;
  if (!valueRanges) {
    throw new Error("No google sheet data");
  }
  const [eventTitles, userEmails] = valueRanges.map((vr) => vr.values?.flat());
  if (!eventTitles || !userEmails) {
    throw new Error("One of the named ranges is missing");
  }
  return eventTitles.map((title, i) => ({
    title: z.string().parse(title),
    email: z.string().email().parse(userEmails[i]),
  }));
};

// recurringEventId
export const getHellscoreEvents = async () => {
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
    throw new Error("No items in hellscore calendar???");
  }
  return items;
};
