/**
 * Extracts a readable error message from any Supabase or unknown error shape.
 * Handles nested objects, HTTP error wrappers, and schema-cache mismatches.
 */
export const getErrorMessage = (error: any): string => {
  const SCHEMA_CACHE_HINT =
    'Run the SQL setup script to create required tables and columns.';
  const SCHEMA_CACHE_FULL_HINT =
    'Your Supabase tables are missing required columns. Open Connect Supabase → SQL Setup, copy the script, and run it in your Supabase SQL Editor, then retry.';

  if (!error) return 'Unknown error';

  let message = 'Unknown error';

  // 1. String errors
  if (typeof error === 'string') {
    message = error;
  }
  // 2. Error instances
  else if (error instanceof Error) {
    message = error.message;
  }
  // 3. Object-based errors
  else if (typeof error === 'object') {
    // Direct string fields
    if (typeof error.message === 'string') {
      message = error.message;
    } else if (typeof error.error_description === 'string') {
      message = error.error_description;
    } else if (typeof error.hint === 'string') {
      message = error.hint;
    }
    // Nested message object
    else if (error.message && typeof error.message === 'object') {
      const nested = error.message;
      if (typeof nested.message === 'string') {
        message = nested.message;
      } else if (typeof nested.error_description === 'string') {
        message = nested.error_description;
      } else if (typeof nested.hint === 'string') {
        message = nested.hint;
      } else {
        try {
          const str = JSON.stringify(nested);
          if (str && str !== '{}' && str !== '"{}"') message = str;
        } catch {
          // ignore
        }
      }
    } else {
      // Fallback: stringify the whole object
      try {
        const str = JSON.stringify(error);
        if (str && str !== '{}' && str !== '"{}"') message = str;
      } catch {
        // ignore
      }
    }
  } else {
    message = String(error);
  }

  // Clean up the output
  message = message.trim();

  // Detect schema-cache mismatch errors
  if (message.includes('schema cache') || message.includes('Could not find the')) {
    return `⚠️ Database schema out of date. ${SCHEMA_CACHE_FULL_HINT} (${message})`;
  }

  return message || 'Unknown database error';
};