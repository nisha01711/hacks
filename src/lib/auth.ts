export type AuthUser = {
  name: string;
  email: string;
  password: string;
};

export type PasswordValidationResult = {
  valid: boolean;
  errors: string[];
};

const USER_KEY = "marketsense_user";
const SESSION_KEY = "marketsense_session";

function isBrowser() {
  return typeof window !== "undefined";
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("At least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("At least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("At least one lowercase letter");
  }
  if (!/\d/.test(password)) {
    errors.push("At least one number");
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push("At least one special character");
  }
  if (/\s/.test(password)) {
    errors.push("No spaces allowed");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
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
  if (!isBrowser()) {
    return { success: false, message: "Browser storage is unavailable." };
  }

  const passwordValidation = validatePassword(user.password);
  if (!passwordValidation.valid) {
    return {
      success: false,
      message: `Password must include: ${passwordValidation.errors.join(", ")}.`,
    };
  }

  localStorage.setItem(USER_KEY, JSON.stringify(user));
  // Registration creates account only; login should create a session.
  localStorage.removeItem(SESSION_KEY);
  return { success: true };
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
