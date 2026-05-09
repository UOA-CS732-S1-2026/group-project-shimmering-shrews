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

# City Quest - Simmering Shrews CS732 Project
### Introduction
CityQuest is a GPS-based city exploration game that encourages users to get outdoors and explore their city, discovering hidden gems and fun things to do along the way.

Every day, users log on and are displayed with a map containing up to 3 challenges within their local area to complete (e.g. "Visit this location and have a conversation with a stranger"). To minimise cheating and force users to actually traverse their city, each challenge is tied to a specific location and can only be marked as completed once the user is near that location. By completing challenges, users earn XP which allows them to level up, build a streak for the number of consecutive days that they've completed a daily challenge, and earn badges for milestones being hit (e.g. "Complete a social challenge to earn this badge").

### Tech Stack
The following technologies are used:
#### Frontend
- React
- TypeScript
- CSS
- Leaflet for displaying the map
- Geoapify API for accessing OpenStreetMap location data

### Backend API
- Express API Server
- Prisma ORM

### Backend Database
- PostgreSQL relational database
  - deployed with Supabase, and using SupaBase auth.

### Deployment Instructions
This project relies on a PostgreSQL database, which must be deployed with SupaBase, in order to make use of Supabase's Auth service.

There is a .env.example file in both the `/frontend` and `/backend` folders, which shows what environment variables are needed.

TODO: Change this part based on what ends up being used

The Frontend web server is deployed with Vercel, and the Backend Express API server with Render.