# HeyJarvis Backend

Backend server for HeyJarvis with Google OAuth 2.0 authentication and JWT session management.

## Tech Stack

- **Node.js** + **Express** - Web server
- **TypeScript** - Type safety
- **MongoDB** + **Mongoose** - Database
- **Google OAuth 2.0** - Authentication
- **JWT** - Session tokens

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   Copy `.env.example` to `.env` and fill in the required values:
   ```env
   PORT=4000
   MONGO_URI=your_mongodb_connection_string
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:4000/auth/google/callback
   JWT_SECRET=your_jwt_secret_key
   ```

3. **Set up Google OAuth:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable Google+ API and Gmail API
   - Create OAuth 2.0 credentials
   - Add `http://localhost:4000/auth/google/callback` to authorized redirect URIs
   - Copy the Client ID and Client Secret to your `.env` file

4. **Run the server:**
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server (requires build first)

## API Endpoints

### Authentication

- **GET `/auth/google/start`** - Redirects to Google OAuth consent screen
- **GET `/auth/google/callback`** - OAuth callback handler (called by Google)
- **GET `/auth/success`** - Success page after authentication

### Protected Routes

- **GET `/me`** - Get current user info
  - Requires: `Authorization: Bearer <JWT_TOKEN>`
  - Returns: `{ email, name, picture }`

### Health Check

- **GET `/health`** - Server health check

## Project Structure

```
backend/
├── src/
│   ├── app.ts                 # Express app configuration
│   ├── server.ts              # Server entry point
│   ├── config/
│   │   └── env.ts            # Environment variables
│   ├── db/
│   │   └── mongo.ts          # MongoDB connection
│   ├── auth/
│   │   ├── auth.routes.ts    # Auth route handlers
│   │   ├── google.oauth.ts   # Google OAuth logic
│   │   └── jwt.ts            # JWT utilities
│   ├── middleware/
│   │   └── authMiddleware.ts  # JWT authentication middleware
│   └── models/
│       ├── User.ts           # User model
│       └── GoogleToken.ts    # Google refresh token model
├── package.json
├── tsconfig.json
└── .env.example
```

## Usage Example

1. Start the server: `npm run dev`
2. Visit: `http://localhost:4000/auth/google/start`
3. Complete Google OAuth flow
4. You'll be redirected to `/auth/success?token=<JWT_TOKEN>`
5. Use the JWT token to access protected routes:
   ```bash
   curl -H "Authorization: Bearer <JWT_TOKEN>" http://localhost:4000/me
   ```

