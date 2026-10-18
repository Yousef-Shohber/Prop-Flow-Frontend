/**
 * The API answers a failed or cancelled Google sign-in on its own origin, so the app never receives an error.
 * We remember that a Google sign-in was started; if the person is back on the login page without a session,
 * it did not complete.
 */
const KEY = "pf-google-pending";
export const markGoogleStart = () => {
  try {
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
};
export const clearGoogleFlag = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};
/** True once if a Google sign-in was started in the last 15 minutes and never produced a session. */
export const consumeGoogleReturn = (): boolean => {
  try {
    const v = Number(sessionStorage.getItem(KEY));
    sessionStorage.removeItem(KEY);
    return !!v && Date.now() - v < 15 * 60_000;
  } catch {
    return false;
  }
};
