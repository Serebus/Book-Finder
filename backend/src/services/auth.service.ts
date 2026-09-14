import { supabase, isSupabaseConfigured } from "../config/supabase.js";
import { UserRow, SessionRow } from "../types/database.types.js";
import {
  generateSecureToken,
  hashPassword,
  comparePassword,
} from "../utils/token.util.js";

const SESSION_TTL_HOURS = parseInt(process.env.SESSION_TTL_HOURS || "24", 10);
const PASSWORD_RESET_TTL_MINUTES = parseInt(
  process.env.PASSWORD_RESET_TTL_MINUTES || "60",
  10
);
const EMAIL_VERIFICATION_TTL_HOURS = parseInt(
  process.env.EMAIL_VERIFICATION_TTL_HOURS || "48",
  10
);

export type SafeUser = Omit<UserRow, "password_hash">;

function assertSupabaseConfigured(): void {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase connection is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file."
    );
  }
}

export class AuthService {
  /**
   * Register a new user and create an initial email verification record.
   */
  static async register(email: string, username: string, password: string): Promise<{
    user: SafeUser;
    verificationToken: string;
  }> {
    assertSupabaseConfigured();

    // Check if email or username is already taken
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("user_id, email, username")
      .or(`email.eq.${email},username.eq.${username}`)
      .maybeSingle();

    if (checkError) {
      throw new Error(`Database error while checking user: ${checkError.message}`);
    }

    if (existingUser) {
      if (existingUser.email.toLowerCase() === email.toLowerCase()) {
        throw new Error("A user with this email already exists.");
      }
      if (existingUser.username.toLowerCase() === username.toLowerCase()) {
        throw new Error("A user with this username already exists.");
      }
    }

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Insert new user
    const { data: newUser, error: insertUserError } = await supabase
      .from("users")
      .insert({
        email: email.trim().toLowerCase(),
        username: username.trim(),
        password_hash: passwordHash,
        email_verified: false,
        is_active: true,
      })
      .select()
      .single();

    if (insertUserError || !newUser) {
      throw new Error(`Failed to create user: ${insertUserError?.message}`);
    }

    // Generate email verification token and expiry
    const verificationToken = generateSecureToken(32);
    const expiresAt = new Date(
      Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000
    ).toISOString();

    const { error: verificationError } = await supabase
      .from("email_verifications")
      .insert({
        user_id: newUser.user_id,
        verification_token: verificationToken,
        expires_at: expiresAt,
        is_verified: false,
      });

    if (verificationError) {
      console.error(
        `Failed to create email verification record: ${verificationError.message}`
      );
    }

    const { password_hash, ...safeUser } = newUser;
    return { user: safeUser, verificationToken };
  }

  /**
   * Verify a user's email address using a verification token.
   */
  static async verifyEmail(token: string): Promise<boolean> {
    assertSupabaseConfigured();

    const { data: verification, error: findError } = await supabase
      .from("email_verifications")
      .select("*")
      .eq("verification_token", token)
      .eq("is_verified", false)
      .maybeSingle();

    if (findError || !verification) {
      throw new Error("Invalid or already used email verification token.");
    }

    if (new Date(verification.expires_at) < new Date()) {
      throw new Error("Email verification token has expired.");
    }

    // Mark verification as verified
    await supabase
      .from("email_verifications")
      .update({ is_verified: true })
      .eq("verification_id", verification.verification_id);

    // Mark user as email_verified
    const { error: userUpdateError } = await supabase
      .from("users")
      .update({ email_verified: true })
      .eq("user_id", verification.user_id);

    if (userUpdateError) {
      throw new Error(`Failed to update user status: ${userUpdateError.message}`);
    }

    return true;
  }

  /**
   * Request a new verification token for an unverified user.
   */
  static async resendVerificationToken(email: string): Promise<string | null> {
    assertSupabaseConfigured();
    const cleanEmail = email.trim().toLowerCase();

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("user_id, email_verified, is_active")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (userError || !user || !user.is_active) {
      return null;
    }

    if (user.email_verified) {
      throw new Error("This email is already verified.");
    }

    const verificationToken = generateSecureToken(32);
    const expiresAt = new Date(
      Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000
    ).toISOString();

    const { error: insertError } = await supabase
      .from("email_verifications")
      .insert({
        user_id: user.user_id,
        verification_token: verificationToken,
        expires_at: expiresAt,
        is_verified: false,
      });

    if (insertError) {
      throw new Error(
        `Failed to generate verification token: ${insertError.message}`
      );
    }

    return verificationToken;
  }

  /**
   * Log in a user, track the attempt in LOGIN_ATTEMPT, and issue a SESSION.
   */
  static async login(
    email: string,
    password: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{
    user: SafeUser;
    session: SessionRow;
  }> {
    assertSupabaseConfigured();

    const cleanEmail = email.trim().toLowerCase();

    // Query user by email
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", cleanEmail)
      .maybeSingle();

    const isUserFound = !userError && !!user;

    // Check credentials if user was found
    let isValidPassword = false;
    if (isUserFound) {
      isValidPassword = await comparePassword(password, user.password_hash);
    }

    const wasSuccessful = isUserFound && isValidPassword && user.is_active;

    // Record login attempt in login_attempts
    await supabase.from("login_attempts").insert({
      user_id: isUserFound ? user.user_id : null,
      email: cleanEmail,
      ip_address: ipAddress || "unknown",
      attempted_at: new Date().toISOString(),
      was_successful: wasSuccessful,
    });

    if (!isUserFound || !isValidPassword) {
      throw new Error("Invalid email or password.");
    }

    if (!user.is_active) {
      throw new Error("Your account has been deactivated. Please contact support.");
    }

    // Create session
    const sessionToken = generateSecureToken(48);
    const expiresAt = new Date(
      Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000
    ).toISOString();

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        user_id: user.user_id,
        token: sessionToken,
        ip_address: ipAddress || "unknown",
        user_agent: userAgent || "unknown",
        expires_at: expiresAt,
        last_activity: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError || !session) {
      throw new Error(`Failed to create session: ${sessionError?.message}`);
    }

    const { password_hash, ...safeUser } = user;
    return { user: safeUser, session };
  }

  /**
   * Destroy an active session by token.
   */
  static async logout(token: string): Promise<boolean> {
    assertSupabaseConfigured();

    const { error } = await supabase.from("sessions").delete().eq("token", token);
    if (error) {
      throw new Error(`Failed to terminate session: ${error.message}`);
    }
    return true;
  }

  /**
   * Create a password reset request and token.
   */
  static async requestPasswordReset(email: string): Promise<string | null> {
    assertSupabaseConfigured();

    const cleanEmail = email.trim().toLowerCase();
    const { data: user } = await supabase
      .from("users")
      .select("user_id, is_active")
      .eq("email", cleanEmail)
      .maybeSingle();

    // If user does not exist or is inactive, return null silently for security
    if (!user || !user.is_active) {
      return null;
    }

    const resetToken = generateSecureToken(32);
    const expiresAt = new Date(
      Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000
    ).toISOString();

    const { error } = await supabase.from("password_resets").insert({
      user_id: user.user_id,
      reset_token: resetToken,
      expires_at: expiresAt,
      is_used: false,
    });

    if (error) {
      throw new Error(`Failed to create password reset request: ${error.message}`);
    }

    return resetToken;
  }

  /**
   * Reset user password with token.
   */
  static async resetPassword(token: string, newPassword: string): Promise<boolean> {
    assertSupabaseConfigured();

    const { data: resetRecord, error: findError } = await supabase
      .from("password_resets")
      .select("*")
      .eq("reset_token", token)
      .eq("is_used", false)
      .maybeSingle();

    if (findError || !resetRecord) {
      throw new Error("Invalid or already used password reset token.");
    }

    if (new Date(resetRecord.expires_at) < new Date()) {
      throw new Error("Password reset token has expired.");
    }

    const passwordHash = await hashPassword(newPassword);

    // Update password
    const { error: userError } = await supabase
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("user_id", resetRecord.user_id);

    if (userError) {
      throw new Error(`Failed to update password: ${userError.message}`);
    }

    // Mark reset token as used
    await supabase
      .from("password_resets")
      .update({ is_used: true })
      .eq("reset_id", resetRecord.reset_id);

    // Invalidate all existing sessions for this user
    await supabase.from("sessions").delete().eq("user_id", resetRecord.user_id);

    return true;
  }

  /**
   * Validate a session token, update last_activity, and retrieve user.
   */
  static async validateSession(
    token: string
  ): Promise<{ user: SafeUser; session: SessionRow } | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (sessionError || !session) {
      return null;
    }

    // Check expiry
    if (new Date(session.expires_at) < new Date()) {
      // Clean up expired session
      await supabase.from("sessions").delete().eq("session_id", session.session_id);
      return null;
    }

    // Fetch user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", session.user_id)
      .maybeSingle();

    if (userError || !user || !user.is_active) {
      return null;
    }

    // Update last_activity timestamp asynchronously
    supabase
      .from("sessions")
      .update({ last_activity: new Date().toISOString() })
      .eq("session_id", session.session_id)
      .then();

    const { password_hash, ...safeUser } = user;
    return { user: safeUser, session };
  }
}
