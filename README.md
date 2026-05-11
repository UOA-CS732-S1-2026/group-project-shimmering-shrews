# CS732 project - Team Shimmering Shrews

Welcome to the CS732 project. We look forward to seeing the amazing things you create this semester! This is your team's repository.

Your team members are:
- Weiwei Fan _(wfan735@aucklanduni.ac.nz)_
- Michael Fu _(mfu466@aucklanduni.ac.nz)_
- Eric Hong _(ehon623@aucklanduni.ac.nz)_
- Hafsa Iqbal _(hiqb269@aucklanduni.ac.nz)_
- Romili Townsend _(rtow454@aucklanduni.ac.nz)_
- Aditya Aryamaan _(aary998@aucklanduni.ac.nz)_

You have complete control over how you run this repo. All your members will have admin access. The only thing setup by default is branch protections on `main`, requiring a PR with at least one code reviewer to modify `main` rather than direct pushes.

Please use good version control practices, such as feature branching, both to make it easier for markers to see your group's history and to lower the chances of you tripping over each other during development

![](./Shimmering%20Shrews.webp)

# Introducing CityQuest - By Team Shimmering Shrew

## Overview

CityQuest is location-based urban exploration application that transforms everyday city activities into personalized quests. Users are given up to three quests within their area and are given a limited amount of time to complete them. Quests have varying activities, locations and XP. These challenges help motivate users to explore their surroundings, earn rewards and grow their knowledge of the city represented through a level system, badges, and a leaderboard ranking system.

When a user opens the app, they are presented with curated challenges tied  to real places nearby like a local restaurant to try, a park landmark to visit or a museum to explore etc. Challenges can only be marked complete when the user's GPS confirms they are physically present at the location, making real-world exploration the core mechanic. Users earn experience points, unlock badges, and build daily streaks as they discover more of the city. 

The motivation for this app comes from a simple observation: people are surrounded by enriching, exciting places they rarely explore, even though spending time outdoors is linked to better wellbeing, lower stress, and stronger community connection. Yet most smartphone use still defaults to passive indoor scrolling. This project directly addresses this by making exploration intrinsically rewarding through structured challenges and visible progress. 

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Leaflet
- **Backend**: Node.js, Express, TypeScript, Prisma
- **Database**: PostgreSQL
- **APIs:** Geoapify (map tiles and location data), Supabase - (authentication and database hosting)

## Getting Started

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

## Deployment

This project is deployed using [Vercel](https://vercel.com) for the frontend and [Render](https://render.com) for the backend.

**Live URL:** https://project-gbq3d.vercel.app  
**Backend URL:** https://group-project-shimmering-shrews.onrender.com

### How it works

- Code is hosted on GitHub
- Vercel automatically deploys the frontend on push to the `main` branch
- The frontend is served via Vercel's CDN
- The backend is hosted on Render as an Express web service

## Project Structure

```
group-project-shimmering-shrews/
├── backend/                    # Express REST API
│   ├── prisma/                 # Database schema and migrations
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

All routes require a valid Supabase Bearer token in the `Authorization` Header.

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
- Pin for Users current location
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
- Supabase handles Google OAuth — no separate Google Cloud setup required for auth
- The database schema is managed via Prisma — run `npx prisma generate` after pulling schema changes
