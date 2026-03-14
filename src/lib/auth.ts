export type AuthUser = {
  name: string;
  email: string;
  password: string;
};

const USER_KEY = "marketsense_user";
const SESSION_KEY = "marketsense_session";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getStoredUser(): AuthUser | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function registerUser(user: AuthUser) {
  if (!isBrowser()) return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(SESSION_KEY, "true");
}

export function loginUser(email: string, password: string) {
  if (!isBrowser()) {
    return { success: false, message: "Browser storage is unavailable." };
  }

  const existingUser = getStoredUser();

  if (!existingUser) {
    return { success: false, message: "No account found. Please sign up first." };
  }

  if (existingUser.email !== email || existingUser.password !== password) {
    return { success: false, message: "Invalid email or password." };
  }

  localStorage.setItem(SESSION_KEY, "true");
  return { success: true, user: existingUser };
}

export function logoutUser() {
  if (!isBrowser()) return;
  localStorage.removeItem(SESSION_KEY);
}

export function getAuthenticatedUser(): AuthUser | null {
  if (!isBrowser()) return null;

  const session = localStorage.getItem(SESSION_KEY);
  if (session !== "true") {
    return null;
  }

  return getStoredUser();
}

export function isAuthenticated() {
  if (!isBrowser()) return false;
  return localStorage.getItem(SESSION_KEY) === "true";
}
