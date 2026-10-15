import { get, post } from "./client";
import type { LoginResult, User } from "@/types/models";
import type { UserRole } from "@/types/enums";

export const authApi = {
  register: (b: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: Extract<UserRole, "TENANT" | "OWNER">;
  }) => post<{ message?: string }>("/auth/register", b),
  login: (b: { email: string; password: string }) =>
    post<LoginResult>("/auth/login", b),
  logout: () => post("/auth/logout"),
  verifyEmail: (b: { email: string; otp: string }) =>
    post<{ message: string }>("/auth/verify-email", b),
  resendOtp: (b: { email: string }) =>
    post<{ message: string }>("/auth/resend-verification-otp", b),
  forgotPassword: (b: { email: string }) =>
    post<{ message: string }>("/auth/forgot-password", b),
  resetPassword: (b: { email: string; otp: string; newPassword: string }) =>
    post<{ message: string }>("/auth/reset-password", b),
  changePassword: (b: { currentPassword: string; newPassword: string }) =>
    post<{ message: string }>("/auth/change-password", b),
  me: () => get<User>("/users/me"),
};
