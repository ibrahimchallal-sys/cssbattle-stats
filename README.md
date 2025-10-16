# CSS Battle Championship Poster

Welcome to the CSS Battle Championship Poster project! This application allows players to register for the championship and provides admin tools to manage participants.

## Features

- Player registration with CSS Battle profile linking
- Admin dashboard with player management
- Automated player score checking
- Responsive design using Tailwind CSS and shadcn/ui components

## Admin Access

Admins can access the login page at `/admin`. The following admin accounts are pre-configured:

- ibrahim.challal@cssbattle.admin
- moneim.mazgoura@cssbattle.admin
- hamdi.boumlik@cssbattle.admin
- youness.hlibi@cssbattle.admin

Admins should set their own passwords through the Supabase authentication system.

## Player Score Automation

To automatically check and update scores for all registered players, run:
```bash
npm run check-player-scores
```

This script will:
1. Fetch all registered players from the database
2. Check each player's current score on CSS Battle
3. Update the database with the latest scores

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Technologies Used

- React with TypeScript
- Vite build tool
- Supabase for backend and authentication
- Tailwind CSS for styling
- shadcn/ui components
- Recharts for data visualization

## Setup

1. Create a Supabase project
2. Set up the database tables using the migration files in `supabase/migrations`
3. Configure environment variables:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_PUBLISHABLE_KEY
4. Run the admin setup scripts to create admin accounts