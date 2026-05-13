# CS732 project - Team Shimmering Shrews
Created by:
- Weiwei Fan _(wfan735@aucklanduni.ac.nz)_
- Michael Fu _(mfu466@aucklanduni.ac.nz)_
- Eric Hong _(ehon623@aucklanduni.ac.nz)_
- Hafsa Iqbal _(hiqb269@aucklanduni.ac.nz)_
- Romili Townsend _(rtow454@aucklanduni.ac.nz)_
- Aditya Aryamaan _(aary998@aucklanduni.ac.nz)_

<img src="./Shimmering Shrews.webp" width="400" height="400">

# Introducing CityQuest - by Team Shimmering Shrews

## Overview

CityQuest is location-based urban exploration game that transforms everyday city activities into personalized quests. Users are given up to three quests within their area and are given a limited amount of time to complete them. Quests have varying activities, locations and XP. These challenges help motivate users to explore their surroundings, earn rewards and grow their knowledge of the city represented through a level system, badges, and a leaderboard ranking system.

When a user opens the app, they are presented with curated challenges tied  to real places nearby like a local restaurant to try, a park landmark to visit or a museum to explore etc. Challenges can only be marked complete when the user's GPS confirms they are physically present at the location, making real-world exploration the core mechanic. Users earn experience points, unlock badges, and build daily streaks as they discover more of the city. 

The motivation for this app comes from a simple observation: people are surrounded by enriching, exciting places they rarely explore, even though spending time outdoors is linked to better wellbeing, lower stress, and stronger community connection. Yet most smartphone use still defaults to passive indoor scrolling. This project directly addresses this by making exploration intrinsically rewarding through structured challenges and visible progress. 

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Leaflet
- **Backend**: Node.js, Express, TypeScript, Prisma
- **Database**: PostgreSQL hosted by Supabase
- **APIs:** Geoapify (map tiles and location data), Supabase (authentication and database hosting), Google (OAuth provider)

# Getting Started
## Local Development Deployment

### Prerequisites 

- Node.js (v20.19 or higher)
- npm 

### Clone Repository

` git clone https://github.com/UOA-CS732-S1-2026/group-project-shimmering-shrews.git `

` cd group-project-shimmering-shrews ` 

### Set up Environment Variables

There are two separate .env.example files containing the keys required to run the application. For the frontend, run in terminal:

` cp frontend/.env.example frontend/.env `

Then run for backend:

` cp backend/.env.example backend/.env `

Alternatively the command:

` cp .env.example .env ` 

can be run in each frontend and backend directories using commands:

` cd backend ` and ` cd frontend `

Then go into the .env files and insert the keys submitted in Private info / API key / etc submission for  both backend and frontend .env files.

### Install Dependencies

Use the command:

` npm install `

for both frontend and backend directories using ` cd backend ` and ` cd frontend ` from the previous section.

### Running Development Server

Run the following commands in two separate terminals:

Terminal 1 - Backend

` cd backend `

` npx prisma generate `

` npm run dev `

Terminal 2 - Frontend

` cd frontend `

` npm run dev `

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:5001`.

### Database Setup

After installing dependencies and setting up your environment variables, initialise the database:

```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
```

This will:
- Create all tables, enums, indexes, and foreign keys
- Apply badge and stat constraints
- Set up badge and stat trigger functions
- Populate initial seed data for categories, badges, locations, and challenges

## Testing

The project includes backend tests, frontend tests, Playwright end-to-end tests, linting, type checking, and build checks.

Install dependencies before running tests:

```bash
cd backend
npm install

cd ../frontend
npm install
```

### Backend

```bash
cd backend
npm run test:typecheck
npm test
npm run build
```

To run backend integration tests, use a disposable PostgreSQL test database because the integration setup resets the public schema:

```powershell
cd backend
$env:RUN_INTEGRATION = "1"
$env:ALLOW_DB_RESET = "1"
$env:TEST_DATABASE_URL = "postgresql://user:password@host:6543/postgres?pgbouncer=true"
$env:TEST_DIRECT_DATABASE_URL = "postgresql://user:password@host:5432/postgres"
npm run test:integration
```

### Frontend

```bash
cd frontend
npm run lint
npm test -- --run
npm run build
```

### End-to-End Tests

```bash
cd frontend
npx playwright install chromium
npm run test:e2e
```

### Run All Safe Local Checks

```bash
cd backend
npm run test:typecheck
npm test
npm run build

cd ../frontend
npm run lint
npm test -- --run
npm run test:e2e
npm run build
```

The backend integration suite is not included in the combined command because it requires a disposable database.

## Deployment

This project is deployed using [Vercel](https://vercel.com) for the frontend web server, [Render](https://render.com) for the backend API, and [Supabase](https://supabase.com) for the backend database.

**Live URL:** https://project-gbq3d.vercel.app  
**Backend API URL:** https://group-project-shimmering-shrews.onrender.com

To see instructions, visit [Cloud Deployment Instructions](#cloud-deployment-instructions)

### How it works

- Code is hosted on GitHub
- Vercel automatically deploys the frontend on push to the `main` branch
- The frontend web server is served via Vercel's CDN
- Render automatically deploys the backend API on push to the `main` branch
- The backend API is hosted on Render as an Express web service
  - Note: Due to this being hosted with Render's free tier, the API will automatically spin down after 15 minutes of inactivity. Calling the API for the first time after inactivity will result in a delay and calls timing out as the web service has to spin back up - this usually takes about one minute. When testing for the very first time or after inactivity, please allow a brief amount of time for the API to start responding to calls.
  - Any calls made after the first response will not have this delay.
- The backend Database is hosted on Supabase as a PostgreSQL database.
- Authentication is provided by an OAuth 2.0 Client on the Google Auth Platform

### Cloud Deployment Instructions
Supabase Database setup:
* Create a Supabase Project
* Create Supabase PostgreSQL database
  * Run the schema in ```backend/sql_scripts/schema.sql```, or let Prisma set it up
  * Copy the triggers and constraints in ```backend/sql_scripts``` and execute them on the database. This is needed for badges to function.
* Set the `backend/.env` fields `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `DATABASE_URL` and `DIRECT_URL` with the values from Supabase.
  * `DIRECT_URL` will be an address with port 5432
  * `DATABASE_URL` will be an address with port 6543
    * Append "/postgres?pgbouncer=true" if it i
* In `frontend/.env` set the `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` fields with these details from Supabase
* Authentication -> Sign In / Providers -> Google
  * enable sign in with google
  * set Client IDS and Client Secrets: These will be obtained during Google OAuth setup, come back to this
  * callback URL (for OAuth): This will be used for setting up Google OAuth


Google OAuth 2.0 Setup:
* Go to Google Cloud Auth Console, create a Google Auth Platform project if you have not already
* Clients -> Create Client -> Application Type: Web Application
* Authorised JavaScript origins: set to the localhost address and port of your frontend server
* Authorised redirect URLS: set to the value in the "callback URL (for OAuth)" field seen during the Supabase setup
* Copy the Client ID and Client Secret fields, return to the Supabase setup instructions from earlier and set these fields in Authentication -> Sign In / Providers -> Google 


Geoapify setup:
* Create an account
* Create project
* Create API Key
* API Keys -> Key -> Allowed Origins -> Add the address of your webserver
  * With this set, Geoapify will only respond to calls from your webserver, so it is now safe to include this key in both your ```/backend/.env``` and ```/frontend/.env``` as `VITE_GEOAPIFY_KEY`


Render Setup:
* Create a Render web service:
* Settings -> Build settings, set root directory to "backend", branch to "main", and build command to: 
  * ```npm install --include=dev && npx prisma generate && npm run build```
* Settings -> Deploy -> set Start Command to ```npm start```
* Settings -> Manage -> Environment -> Environment Variables -> Add variable -> import from .env (import the backend .env file)
* My Project -> Overview -> click on your web service
  * There should be a URL to your web service, with a copy icon, click this and copy it to the frontend end at `frontend/.env` giving it the key `VITE_BACKEND_URL`.

Vercel Setup:
* Create a Vercel Project
* Connect that vercel project to this repository
* Settings -> Build and Development -> Framework settings -> set "Framework preset" to "Vite"
* Settings -> Build and Development -> set root directory to "frontend"
* Settings -> Environment connect Production with "main" branch if it isn't already. 
  * Scroll to the Environment Variables section and import the frontend env file.
* On commits to main, Vercel will automatically run the commands needed to build and host a React Vite webserver
* In `backend/.env` set the `WEBSERVER_URLS` field to the deployed Vercel project's URLs, separating each URL with a comma.

## Project Structure

```
group-project-shimmering-shrews/
├── backend/                    # Express REST API
│   ├── prisma/                 # Database schema and migrations
│   ├── sql_scripts/            # PostgreSQL triggers to add to database for badges/stats
│   ├── src/                    # Application source code
│   ├── tests/                  # Backend test suite
│   ├── prisma.config.ts        # Prisma configuration
│   └── .env.example            # Environment variable template
├── frontend/                   # React frontend application
│   ├── public/                 # Static assets
│   ├── src/                    # Application source code
│   ├── vite.config.ts          # Vite configuration
│   └── .env.example            # Environment variable template
└── diagrams/                   # ERD and sequence diagrams
```

## API Routes

All API endpoints are protected from unauthenticated and unauthorised users. All routes require a valid Supabase Bearer token in the `Authorization` Header, which is obtained by signing in.

### User Challenges

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/user-challenges/today` | Get or create today's challenges for the user |
| GET | `/user-challenges/:id` | Get a specific user challenge |
| PATCH | `/user-challenges/:id/accept` | Accept a challenge |
| PATCH | `/user-challenges/:id/cancel` | Cancel a challenge |
| POST | `/user-challenges/:id/checkin` | Check in to a challenge |

### Challenges

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/challenges` | Get all active challenges |
| GET | `/challenges/:id` | Get a specific challenge |

### User

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/leaderboard` | Get top 10 users by XP |
| GET | `/api/user/profile-info` | Get the logged in user's profile info |

### Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile/me` | Get the logged in user's full profile |

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/validate-session` | Validate a Supabase session token |
| POST | `/api/auth/sync-user` | Sync a Supabase user with the database |

### Locations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/locations` | Fetch and seed locations from Geoapify |

## Features

### Map View

- Interactive map showing nearby challenges within walking distance
- Marker for User's current location
- Challenge markers grouped by category with color coded icons
- Clickable challenge clusters when multiple challenges share a location
- Route display to guide users to accepted challenges

### Daily Challenges

- Up to three challenges assigned per day based on proximity to the user
- Challenges refresh automatically each day
- Challenges expire at midnight if not completed
- Configurable challenge limit and radius

### Challenge Flow

- Accept a challenge to get directions to the location
- Check in when within range to complete and earn XP
- Cancel a challenge if you change your mind

### Profile

- View your level, XP progress bar, streak, and challenge stats
- XP and leveling system that tracks progress over time

### Badges

- Earn badges by completing challenges and reaching milestones
- Badge vault showing earned and locked badges

### Leaderboard

- Top 10 users ranked by XP earned
- Current user highlighted in the list
- User rank displayed even if outside the top 10

### Authentication

- Google OAuth login via Supabase
- Secure JWT based session management

## Developer Notes

- `DEV_SHOW_ALL` flag in `frontend/src/config/featureFlags.ts` bypasses location permission and shows all challenges — set to `false` before deploying
- The backend runs `prisma generate` automatically on `npm install` via the postinstall script
- All backend routes require a valid Supabase Bearer token in the `Authorization` header
- Challenge filtering uses the Haversine formula to calculate distance between coordinates
- `DAILY_CHALLENGE_LIMIT` in `backend/src/services/challengeService.ts` controls how many challenges are assigned per day
- The database schema is managed via Prisma — run `npx prisma generate` after pulling schema changes.
- If setting this up for yourself, the database triggers stored in `sql_scripts` must be run on the PostgreSQL database.
- When testing for the very first time or after inactivity, please allow a brief amount of time for the backend API to start responding to calls (about one minute) - a limitation of Render's free tier is that it spins down after 15 minutes of inactivity and start back up after it detects an API call.
