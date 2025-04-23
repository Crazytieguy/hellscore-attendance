import { google } from "googleapis";
import { writeResponseRow, getSheetContent, getHellscoreEvents } from "../../server/googleApis";
import { env } from "../../env/server.mjs";

// Mock googleapis
jest.mock("googleapis", () => {
  const mockAppend = jest.fn().mockResolvedValue({ data: { updates: { updatedCells: 1 } } });
  const mockBatchGet = jest.fn();
  const mockEventsList = jest.fn();

  return {
    google: {
      auth: {
        fromJSON: jest.fn().mockReturnValue({
          scopes: [],
        }),
      },
      sheets: jest.fn().mockReturnValue({
        spreadsheets: {
          values: {
            append: mockAppend,
            batchGet: mockBatchGet,
          },
        },
      }),
      calendar: jest.fn().mockReturnValue({
        events: {
          list: mockEventsList,
        },
      }),
    },
    mockAppend,
    mockBatchGet,
    mockEventsList,
  };
});

// Mock env variables
jest.mock("../../env/server.mjs", () => ({
  env: {
    GOOGLE_SERVICE_ACCOUNT_CREDENTIALS: JSON.stringify({
      type: "service_account",
      project_id: "test-project",
    }),
    SHEET_ID: "test-sheet-id",
  },
}));

const { mockAppend, mockBatchGet, mockEventsList } = jest.requireMock("googleapis");

describe("Google APIs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("writeResponseRow", () => {
    it("successfully writes a row to the spreadsheet", async () => {
      const testRow = ["John Doe", "john@example.com", "Yes", "2023-04-24"];
      
      await writeResponseRow(testRow);
      
      expect(mockAppend).toHaveBeenCalledWith({
        spreadsheetId: env.SHEET_ID,
        requestBody: { values: [testRow] },
        range: "response",
        valueInputOption: "USER_ENTERED",
      });
    });

    it("retries on retryable errors", async () => {
      const testRow = ["Jane Doe", "jane@example.com", "No", "2023-04-25"];
      
      // Mock first call to fail with rate limit error, second to succeed
      mockAppend
        .mockRejectedValueOnce({ 
          response: { status: 429 },
          message: "Rate limit exceeded"
        })
        .mockResolvedValueOnce({ data: { updates: { updatedCells: 1 } } });
      
      await writeResponseRow(testRow);
      
      // Expect that the function was called twice (first fails, second succeeds)
      expect(mockAppend).toHaveBeenCalledTimes(2);
      expect(mockAppend).toHaveBeenCalledWith({
        spreadsheetId: env.SHEET_ID,
        requestBody: { values: [testRow] },
        range: "response",
        valueInputOption: "USER_ENTERED",
      });
    });

    it("does not retry on non-retryable errors", async () => {
      const testRow = ["Test User", "test@example.com", "Maybe", "2023-04-26"];
      
      // Mock a non-retryable error
      const error = new Error("Permission denied");
      error.response = { status: 403 };
      mockAppend.mockRejectedValueOnce(error);
      
      await expect(writeResponseRow(testRow)).rejects.toThrow();
      
      // Should only be called once since this is not a retryable error
      expect(mockAppend).toHaveBeenCalledTimes(1);
    });
  });

  describe("getSheetContent", () => {
    it("successfully retrieves and formats sheet content", async () => {
      // Mock the response from Google Sheets API
      mockBatchGet.mockResolvedValueOnce({
        data: {
          spreadsheetId: "test-sheet-id",
          valueRanges: [
            {
              values: [["Event 1"], ["Event 2"]],
            },
            {
              values: [["user1@example.com"], ["user2@example.com"]],
            },
          ],
        },
      });
      
      const result = await getSheetContent();
      
      expect(mockBatchGet).toHaveBeenCalledWith({
        spreadsheetId: env.SHEET_ID,
        ranges: ["user_event_event_title", "user_event_user_email"],
      });
      
      expect(result).toEqual([
        { title: "Event 1", email: "user1@example.com" },
        { title: "Event 2", email: "user2@example.com" },
      ]);
    });

    it("throws error when data format is invalid", async () => {
      // Mock invalid response
      mockBatchGet.mockResolvedValueOnce({
        data: {
          spreadsheetId: "test-sheet-id",
          valueRanges: [
            {
              values: [["Event 1"]],
            },
            {
              values: [["not-an-email"]],  // Invalid email will cause validation error
            },
          ],
        },
      });
      
      await expect(getSheetContent()).rejects.toThrow();
    });
  });

  describe("getHellscoreEvents", () => {
    it("successfully retrieves upcoming events", async () => {
      const mockEvents = {
        data: {
          items: [
            {
              id: "event1",
              summary: "Rehearsal",
              start: { dateTime: "2023-04-25T19:00:00Z" },
            },
            {
              id: "event2",
              summary: "Performance",
              start: { dateTime: "2023-04-28T20:00:00Z" },
            },
          ],
        },
      };
      
      mockEventsList.mockResolvedValueOnce(mockEvents);
      
      const result = await getHellscoreEvents();
      
      expect(mockEventsList).toHaveBeenCalledWith({
        calendarId: "6bo68oo6iujc4obpo3fvanpd24@group.calendar.google.com",
        maxAttendees: 1,
        maxResults: 20,
        orderBy: "startTime",
        singleEvents: true,
        timeMin: expect.any(String),
      });
      
      expect(result).toEqual(mockEvents.data.items);
    });

    it("throws error when no events are found", async () => {
      // Mock empty response
      mockEventsList.mockResolvedValueOnce({
        data: {}  // No items property
      });
      
      await expect(getHellscoreEvents()).rejects.toThrow("No items in hellscore calendar???");
    });
  });
});