# Technical Specification

## System Overview
The system is a full-stack web application leveraging Supabase for backend services, Next.js for the frontend, and various external APIs for additional functionality. The primary purpose of the system is to provide user authentication, data management, and interactive features such as posting and sharing content. 

### Main Components and Their Roles
- **Frontend**: Built using Next.js, it handles user interactions, routing, and displaying data.
- **Backend**: Utilizes Supabase for database management, authentication, and serverless functions.
- **Database**: PostgreSQL database managed by Supabase, with Row-Level Security (RLS) policies.
- **External APIs**: Integrations with Resend for email services, Dub for URL shortening, Loops for newsletter subscriptions, and OpenPanel for analytics.

## Core Functionality
### Authentication and User Management
- **Supabase Authentication**: Handled via Supabase’s built-in authentication mechanisms. New users are inserted into the `public.users` table using the `handle_new_user` function defined in `20240901155537_create_auth_users_triggers.sql`.
- **OAuth Callback**: Managed in `apps/app/src/app/api/auth/callback/route.ts`, which processes the Google sign-in OAuth callback and redirects users accordingly.

### Database Schema and Seed Data
- **Users Table**: Created in `20240901155538_create_users_table.sql` with RLS policies for secure data access.
- **Posts Table**: Created in `20240901165124_create_posts_table.sql` with RLS policies.
- **Seed Data**: Defined in `apps/api/supabase/seed.sql` to populate initial data for `auth.users`, `auth.identities`, and `posts` tables.

### Serverless Functions
- **Send Email**: Defined in `apps/api/supabase/functions/send-email/index.ts`, this function uses the Resend API to send emails based on webhook events.

### Actions and Middleware
- **Safe Actions**: Defined in `apps/app/src/actions/safe-action.ts`, these provide safe action clients with error handling, rate limiting, and analytics tracking.
- **Middleware**: Handles session updates and redirects in `apps/app/src/middleware.ts`.

### Post and User Actions
- **Share Link Action**: Creates a short link for a post using the `dub` service in `apps/app/src/actions/post/share-link-action.ts`.
- **Update User Action**: Updates user information in `apps/app/src/actions/user/update-post-action.ts`.

### Supabase Clients
- **Client Creation**: Supabase clients are created for both browser and server-side usage in `packages/supabase/src/clients/client.ts` and `packages/supabase/src/clients/server.ts` respectively.
- **Middleware**: Updates the Supabase session in `packages/supabase/src/clients/middleware.ts`.

### Analytics
- **Client-side Analytics**: Set up and tracks events using OpenPanel in `packages/analytics/src/client.tsx`.
- **Server-side Analytics**: Initializes analytics tracking on the server-side in `packages/analytics/src/server.ts`.

## Architecture
### Data Flow
1. **User Authentication**:
   - Users authenticate via Google OAuth.
   - The callback is handled in `apps/app/src/app/api/auth/callback/route.ts`.
   - A new user is inserted into the `public.users` table via the `handle_new_user` trigger.

2. **Post Creation and Management**:
   - Users create posts, which are stored in the `posts` table with RLS policies.
   - Actions like sharing a link are handled in `apps/app/src/actions/post/share-link-action.ts`.

3. **Email Notifications**:
   - Emails are sent using the `sendEmail` function in `apps/api/supabase/functions/send-email/index.ts`.

4. **Analytics Tracking**:
   - Client-side events are tracked using `packages/analytics/src/client.tsx`.
   - Server-side events are initialized in `packages/analytics/src/server.ts`.

5. **Session Management**:
   - Middleware in `apps/app/src/middleware.ts` handles session updates and redirects.