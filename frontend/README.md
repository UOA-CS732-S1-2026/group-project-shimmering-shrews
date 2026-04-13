# CityQuest Frontend - US03 User Profile

This frontend contains the **US03_user_profile** work for CityQuest. It is a responsive profile page where a user can view their progress, badges, city quest history, and account actions.

## What This Page Includes

- Profile page for `John Doe`
- Generic profile placeholder image
- XP and level display
- XP progress bar
- Stats cards for streak, badges, and completed city quests
- Badge grid with earned and locked city exploration badges
- Activity history tab
- Logout button with simple feedback message
- Bottom navigation with map and selected profile icons
- Mock data only, no backend required

## Tech Stack

- React
- TypeScript
- Vite
- Plain CSS

## Useful Files

```text
src/pages/ProfilePage.tsx      Main profile page
src/components/                Profile UI components
src/data/profileData.ts        Mock profile, badge, and history data
src/types/profile.ts           TypeScript types
src/App.css                    Page styling
```

## Run Locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://localhost:5173
```

## Check The Build

```bash
npm run build
```

## Notes

- This is frontend-only for now.
- The profile data is mocked in `src/data/profileData.ts`.
- The backend is not needed to view or test this page.
