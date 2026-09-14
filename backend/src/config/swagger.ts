export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Book-Finder Authentication API",
    version: "1.0.0",
    description:
      "RESTful Authentication & Session Management API connected to Supabase PostgreSQL, implementing the Login Register ERD schema.",
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local development server",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "Token",
        description: "Enter your active session token",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          user_id: { type: "integer", example: 1 },
          email: { type: "string", format: "email", example: "user@example.com" },
          username: { type: "string", example: "johndoe" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
          email_verified: { type: "boolean", example: false },
          is_active: { type: "boolean", example: true },
        },
      },
      Session: {
        type: "object",
        properties: {
          session_id: { type: "integer", example: 1 },
          user_id: { type: "integer", example: 1 },
          token: { type: "string", example: "4a7f9b8c2d1e0..." },
          ip_address: { type: "string", example: "127.0.0.1" },
          user_agent: { type: "string", example: "Mozilla/5.0..." },
          created_at: { type: "string", format: "date-time" },
          expires_at: { type: "string", format: "date-time" },
          last_activity: { type: "string", format: "date-time" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["email", "username", "password"],
        properties: {
          email: { type: "string", format: "email", example: "reader@example.com" },
          username: { type: "string", example: "reader42" },
          password: { type: "string", format: "password", example: "StrongPassword123" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "reader@example.com" },
          password: { type: "string", format: "password", example: "StrongPassword123" },
        },
      },
      VerifyEmailRequest: {
        type: "object",
        required: ["token"],
        properties: {
          token: { type: "string", example: "a9c1e7f0b2d3..." },
        },
      },
      ResendVerificationRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email", example: "reader@example.com" },
        },
      },
      ForgotPasswordRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email", example: "reader@example.com" },
        },
      },
      ResetPasswordRequest: {
        type: "object",
        required: ["token", "newPassword"],
        properties: {
          token: { type: "string", example: "b8d2e4f6..." },
          newPassword: { type: "string", format: "password", example: "NewSecurePassword456" },
        },
      },
      LogoutRequest: {
        type: "object",
        properties: {
          token: { type: "string", description: "Optional if Bearer header is sent", example: "4a7f9b8c2d1e0..." },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        summary: "Service Health Check",
        description: "Returns health status and uptime of the API server.",
        responses: {
          200: {
            description: "Server is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "healthy" },
                    timestamp: { type: "string" },
                    uptime: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a new user",
        description:
          "Creates a new user record in 'users' and generates an unverified record in 'email_verifications'.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "User registered successfully",
          },
          400: {
            description: "Validation error or user already exists",
          },
        },
      },
    },
    "/api/auth/verify-email": {
      post: {
        tags: ["Authentication"],
        summary: "Verify user email",
        description:
          "Validates token against 'email_verifications' and sets email_verified = true in 'users'.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerifyEmailRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Email verified successfully",
          },
          400: {
            description: "Invalid or expired token",
          },
        },
      },
    },
    "/api/auth/resend-verification": {
      post: {
        tags: ["Authentication"],
        summary: "Resend email verification token",
        description:
          "Generates a new verification token in 'email_verifications' for an unverified user account.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResendVerificationRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "New verification token generated successfully",
          },
          400: {
            description: "Email is already verified or user not found",
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "User Login",
        description:
          "Verifies credentials, records an entry into 'login_attempts', and creates a new session in 'sessions'.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful with session token",
          },
          401: {
            description: "Invalid credentials or inactive account",
          },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "User Logout",
        description: "Terminates and removes the session from the 'sessions' table.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LogoutRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Logged out successfully",
          },
        },
      },
    },
    "/api/auth/forgot-password": {
      post: {
        tags: ["Authentication"],
        summary: "Request Password Reset",
        description:
          "Generates a reset token stored in 'password_resets' with an expiration.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ForgotPasswordRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Password reset token generated",
          },
        },
      },
    },
    "/api/auth/reset-password": {
      post: {
        tags: ["Authentication"],
        summary: "Reset Password",
        description:
          "Validates reset token from 'password_resets', hashes new password, updates 'users', and marks token as used.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResetPasswordRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Password reset successful",
          },
          400: {
            description: "Invalid or expired token",
          },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get current user profile & active session",
        description:
          "Protected route requiring Authorization: Bearer <session_token>. Updates last_activity timestamp.",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Profile and active session details",
          },
          401: {
            description: "Unauthorized / expired session",
          },
        },
      },
    },
  },
};
