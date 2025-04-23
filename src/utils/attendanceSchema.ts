import { z } from "zod";

/**
 * Sanitizes text input to prevent Google Sheets errors
 * - Removes leading/trailing whitespace
 * - Restricts string length
 * - Escapes formula triggers (=, +, -, @, etc.)
 * - Removes invalid characters
 */
export const sanitizeText = (text: string | undefined | null): string => {
  if (!text) return "";
  
  // Trim whitespace
  let sanitized = text.trim();
  
  // Limit length
  sanitized = sanitized.substring(0, 1000);
  
  // Escape formula triggers by adding a single quote at the beginning if needed
  if (/^[=+\-@]/.test(sanitized)) {
    sanitized = `'${sanitized}`;
  }
  
  // Remove any characters that might cause issues
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");
  
  return sanitized;
};

export const attendanceSchema = z.object({
  eventTitle: z.string(),
  eventDate: z.string(),
  going: z.boolean(),
  whyNot: z.string().optional(),
  wentLastTime: z.boolean(),
  comments: z.string().optional(),
});
