import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";

export class AuthController {
  /**
   * POST /api/auth/register
   */
  static async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, username, password } = req.body;

      if (!email || !username || !password) {
        res.status(400).json({
          error: "BadRequest",
          message: "Email, username, and password are required.",
        });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({
          error: "BadRequest",
          message: "Password must be at least 8 characters long.",
        });
        return;
      }

      const result = await AuthService.register(email, username, password);

      res.status(201).json({
        success: true,
        message:
          "User registered successfully. Please verify your email using the provided verification token.",
        data: {
          user: result.user,
          // In production you would email this; exposing here for easy testing/integration
          verificationToken: result.verificationToken,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        error: "RegistrationFailed",
        message: error.message || "Failed to register user.",
      });
    }
  }

  /**
   * POST /api/auth/verify-email
   */
  static async verifyEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const token = req.body.token || req.query.token;

      if (!token || typeof token !== "string") {
        res.status(400).json({
          error: "BadRequest",
          message: "Verification token is required.",
        });
        return;
      }

      await AuthService.verifyEmail(token);

      res.status(200).json({
        success: true,
        message: "Email has been successfully verified.",
      });
    } catch (error: any) {
      res.status(400).json({
        error: "VerificationFailed",
        message: error.message || "Invalid or expired verification token.",
      });
    }
  }

  /**
   * POST /api/auth/login
   */
  static async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          error: "BadRequest",
          message: "Email and password are required.",
        });
        return;
      }

      const ipAddress =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        "127.0.0.1";
      const userAgent = (req.headers["user-agent"] as string) || "unknown";

      const { user, session } = await AuthService.login(
        email,
        password,
        ipAddress,
        userAgent
      );

      res.status(200).json({
        success: true,
        message: "Login successful.",
        data: {
          token: session.token,
          expiresAt: session.expires_at,
          user,
        },
      });
    } catch (error: any) {
      res.status(401).json({
        error: "AuthenticationFailed",
        message: error.message || "Invalid email or password.",
      });
    }
  }

  /**
   * POST /api/auth/logout
   */
  static async logout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token =
        req.body.token ||
        (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null);

      if (!token) {
        res.status(400).json({
          error: "BadRequest",
          message: "Session token is required to log out.",
        });
        return;
      }

      await AuthService.logout(token);

      res.status(200).json({
        success: true,
        message: "Logged out successfully.",
      });
    } catch (error: any) {
      res.status(500).json({
        error: "LogoutFailed",
        message: error.message || "Failed to log out.",
      });
    }
  }

  /**
   * POST /api/auth/forgot-password
   */
  static async forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          error: "BadRequest",
          message: "Email is required.",
        });
        return;
      }

      const resetToken = await AuthService.requestPasswordReset(email);

      // Return a consistent message regardless of whether user exists
      res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, a password reset token has been issued.",
        // For development / initial integration convenience:
        ...(resetToken && process.env.NODE_ENV === "development"
          ? { devResetToken: resetToken }
          : {}),
      });
    } catch (error: any) {
      res.status(500).json({
        error: "ServerError",
        message: error.message || "Failed to process password reset request.",
      });
    }
  }

  /**
   * POST /api/auth/reset-password
   */
  static async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        res.status(400).json({
          error: "BadRequest",
          message: "Reset token and new password are required.",
        });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({
          error: "BadRequest",
          message: "New password must be at least 8 characters long.",
        });
        return;
      }

      await AuthService.resetPassword(token, newPassword);

      res.status(200).json({
        success: true,
        message:
          "Password has been reset successfully. Please log in with your new password.",
      });
    } catch (error: any) {
      res.status(400).json({
        error: "ResetPasswordFailed",
        message: error.message || "Invalid or expired password reset token.",
      });
    }
  }

  /**
   * GET /api/auth/me (Protected)
   */
  static async getMe(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
        session: {
          sessionId: req.session?.session_id,
          ipAddress: req.session?.ip_address,
          userAgent: req.session?.user_agent,
          createdAt: req.session?.created_at,
          expiresAt: req.session?.expires_at,
          lastActivity: req.session?.last_activity,
        },
      },
    });
  }
}
