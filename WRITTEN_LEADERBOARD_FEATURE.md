# Written Test Leaderboard Feature

## Overview
A comprehensive leaderboard system for written test scores that allows filtering by competition and displays aggregated scores from the `written_tests` database table. The implementation uses tRPC for type-safe API calls and follows the same design pattern as the existing problem leaderboard.

## Features Implemented

### 1. Competition Filtering
- Users can filter leaderboard by specific competitions
- Dropdown shows all available competitions that have scores
- Includes an "All Competitions" option to view aggregated scores across all tests
- **Default behavior**: Automatically selects the competition with the most recent score

### 2. Search Functionality
- Real-time search to filter users by name
- Case-insensitive search
- Works in conjunction with competition filter

### 3. Privacy Respect
- Only displays scores for users who have `showScoresInLeaderboard` set to `true`
- Follows the same privacy pattern as the problem leaderboard

### 4. Score Aggregation
- When a specific competition is selected: Shows total score for that competition per user
- When "All Competitions" is selected: Shows total score across all competitions per user
- Scores are sorted in descending order (highest to lowest)

## Files Created/Modified

### Backend (tRPC Router)

#### `src/server/api/routers/written.ts` (NEW)
Contains three tRPC procedures:

1. **`getLeaderboard`**
   - Input: `{ competition?: "VCM-1" | "VCM-2" | ... }` (optional)
   - Returns: Array of `{ id, name, score }` sorted by score descending
   - Aggregates scores by user for the selected competition (or all if not specified)

2. **`getAvailableCompetitions`**
   - Input: None
   - Returns: Array of distinct competition names that have scores
   - Used to populate the competition filter dropdown

3. **`getMostRecentCompetition`**
   - Input: None
   - Returns: Competition name with the most recent `takenAt` date
   - Used to set the default competition filter

#### `src/server/api/root.ts` (MODIFIED)
- Added `written: writtenRouter` to the main app router
- Makes queries available via `api.written.*`

### Frontend

#### `src/app/leaderboard/written/written-leaderboard.tsx` (NEW)
Client component featuring:
- Competition filter dropdown using shadcn/ui `Select` component
- Search input for filtering by username
- Responsive table showing rank, username, and score
- Loading states
- Auto-selection of most recent competition on mount

#### `src/app/leaderboard/written/page.tsx` (MODIFIED)
- Server component that renders the `WrittenLeaderboard` client component
- Uses same styling as problem leaderboard page

### Navigation

#### `src/components/global/Navbar.tsx` (MODIFIED)