import { google } from "googleapis";
import { env } from "../env/server.mjs";

const auth = google.auth.fromJSON(
  JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS)
);
auth.scopes = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/spreadsheets",
];
const sheets = google.sheets({ version: "v4", auth });

export const writeAttendanceRow = async (row: string[]) => {
  return await sheets.spreadsheets.values.append({
    spreadsheetId: env.SHEET_ID,
    requestBody: { values: [row] },
    range: "Responses!A2",
    valueInputOption: "RAW",
  });
};
