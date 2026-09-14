# Book-Finder Backend (TypeScript & Supabase)

TypeScript backend for the Book-Finder project with custom authentication and session management connected to Supabase PostgreSQL, implementing the **Login Register** ERD schema.

---

## 🗄️ Database Architecture (ERD Schema)

This backend maps directly to the following relational model in Supabase:

1. **`users`**
   - `user_id`: Serial primary key
   - `email`: Varchar(255), Unique, Not Null
   - `username`: Varchar(100), Unique, Not Null
   - `password_hash`: Varchar(255), Not Null
   - `created_at`: Timestamp with timezone, Not Null
   - `updated_at`: Timestamp with timezone, Not Null (auto-updated by trigger)
   - `email_verified`: Boolean, Not Null (default: `false`)
   - `is_active`: Boolean, Not Null (default: `true`)

2. **`sessions`**
   - `session_id`: Serial primary key
   - `user_id`: Foreign key -> `users(user_id)` (Cascade delete)
   - `token`: Varchar(512), Unique, Not Null
   - `ip_address`: Varchar(45), Not Null
   - `user_agent`: Varchar(512), Not Null
   - `created_at`: Timestamp with timezone, Not Null
   - `expires_at`: Timestamp with timezone, Not Null
   - `last_activity`: Timestamp with timezone, Not Null

3. **`password_resets`**
   - `reset_id`: Serial primary key
   - `user_id`: Foreign key -> `users(user_id)` (Cascade delete)
   - `reset_token`: Varchar(512), Unique, Not Null
   - `created_at`: Timestamp with timezone, Not Null
   - `expires_at`: Timestamp with timezone, Not Null
   - `is_used`: Boolean, Not Null (default: `false`)

4. **`email_verifications`**
   - `verification_id`: Serial primary key
   - `user_id`: Foreign key -> `users(user_id)` (Cascade delete)
   - `verification_token`: Varchar(512), Unique, Not Null
   - `created_at`: Timestamp with timezone, Not Null
   - `expires_at`: Timestamp with timezone, Not Null
   - `is_verified`: Boolean, Not Null (default: `false`)

5. **`login_attempts`**
   - `attempt_id`: Serial primary key
   - `user_id`: Foreign key -> `users(user_id)` (Set Null on delete, nullable)
   - `email`: Varchar(255), Not Null
   - `ip_address`: Varchar(45), Not Null
   - `attempted_at`: Timestamp with timezone, Not Null
   - `was_successful`: Boolean, Not Null

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase credentials:
```env
PORT=5000
NODE_ENV=development

SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-secret-key>
SUPABASE_ANON_KEY=<your-supabase-anon-key>

SESSION_TTL_HOURS=24
PASSWORD_RESET_TTL_MINUTES=60
EMAIL_VERIFICATION_TTL_HOURS=48
```

> **Where to get Supabase keys**: In your Supabase project dashboard, navigate to **Project Settings** -> **API**. Use the **`service_role`** key for backend queries to bypass RLS for administrative access, or use the **`anon`** key if you configure RLS policies.

### 3. Run the Database Migration in Supabase

1. Open your **Supabase Dashboard** -> **SQL Editor**.
2. Open the file `backend/supabase/migrations/001_initial_auth_schema.sql`.
3. Paste the contents into the SQL Editor and click **Run**.

This creates the 5 tables, indices, and the automated `updated_at` trigger.

### 4. Run the Backend

- **Development mode (hot reload via `tsx watch`)**:
  ```bash
  npm run dev
  ```

- **Typecheck without building**:
  ```bash
  npm run typecheck
  ```

- **Build for production**:
  ```bash
  npm run build
  ```

- **Start production server**:
  ```bash
  npm start
  ```

---

## 📚 Interactive Swagger UI Documentation

Once the server is running, you can view, test, and explore all endpoints interactively in your browser:

- **Swagger UI**: [http://localhost:5000/docs](http://localhost:5000/docs) (or `http://localhost:5000/api-docs`)
- **OpenAPI 3.0 JSON Spec**: [http://localhost:5000/docs.json](http://localhost:5000/docs.json)

---

## 📡 API Endpoints

### Health Check
- `GET /health` -> Returns service status, uptime, and timestamp.

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user & create email verification record | No |
| `POST` | `/api/auth/verify-email` | Verify user email with verification token | No |
| `POST` | `/api/auth/resend-verification` | Generate a new verification token for an unverified user | No |
| `POST` | `/api/auth/login` | Login user, log attempt in `login_attempts`, create `session` | No |
| `POST` | `/api/auth/logout` | Invalidate active session | Yes / Token |
| `POST` | `/api/auth/forgot-password` | Request password reset token | No |
| `POST` | `/api/auth/reset-password` | Reset password using reset token | No |
| `GET` | `/api/auth/me` | Fetch currently authenticated user and session details | Yes (`Bearer <token>`) |

---

### Example Requests

#### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","username":"booklover","password":"SuperSecretPassword123"}'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SuperSecretPassword123"}'
```

#### Protected Route (`/api/auth/me`)
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <session_token_here>"
```
