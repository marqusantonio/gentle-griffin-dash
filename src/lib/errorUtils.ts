/**
 * Detects if an error is due to a missing table or schema cache in Supabase
 */
export const isTableOrSchemaMissingError = (error: any): boolean => {
  if (!error) return false;
  const msg = typeof error === 'string' ? error : error?.message || error?.error_description || JSON.stringify(error);
  return (
    msg.includes('schema cache') ||
    msg.includes('Could not find the table') ||
    msg.includes('relation') ||
    msg.includes('does not exist')
  );
};

/**
 * Extracts a readable error message from any Supabase or unknown error shape.
 */
export const getErrorMessage = (error: any): string => {
  if (!error) return 'Unknown error';

  let message = 'Unknown error';

  if (typeof error === 'string') {
    message = error;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'object') {
    if (typeof error.message === 'string') {
      message = error.message;
    } else if (typeof error.error_description === 'string') {
      message = error.error_description;
    } else if (typeof error.hint === 'string') {
      message = error.hint;
    } else {
      try {
        message = JSON.stringify(error);
      } catch {
        // ignore
      }
    }
  } else {
    message = String(error);
  }

  message = message.trim();

  if (isTableOrSchemaMissingError(message)) {
    return `Database tables not created yet. Open Connect Supabase → SQL Setup, copy the script, and run it in your Supabase SQL Editor.`;
  }

  return message || 'Unknown database error';
};