# Syntax Saga: The Multiverse Coding Adventure

A retro-style 2D platformer game built with React, TypeScript, and Vite. Learn coding concepts while exploring five different realms and defeating the Bug King!

## Features

- **Retro Aesthetic**: Pixel art style with CRT scanlines and matrix rain effects.
- **Coding Challenges**: Solve language-specific puzzles (JavaScript, Python, C++, etc.) to progress.
- **Multiple Levels**: Explore diverse environments with unique mechanics.
- **Leaderboard**: Compete with other players for the high score.
- **Google Authentication**: Securely sign in to save your progress and compete on the leaderboard.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: React Hooks, TanStack Query
- **Authentication**: Google OAuth 2.0 (@react-oauth/google)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or bun

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Vijay-Nalla/code-quest-adventures.git
   ```

2. Navigate to the project directory:
   ```bash
   cd code-quest-adventures
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:8080`.

## Configuration

To enable Google Authentication, you need to provide your own Google Client ID in `src/App.tsx`:

```typescript
const GOOGLE_CLIENT_ID = "YOUR_CLIENT_ID.apps.googleusercontent.com";
```

## Development

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Builds the project for production.
- `npm run lint`: Runs ESLint to check for code quality issues.
- `npm run test`: Runs the test suite using Vitest.

## License

MIT License
