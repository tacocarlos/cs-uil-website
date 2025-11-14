# Year Filtering Feature for Written Test Leaderboard

## Overview
Added year-based filtering to the written test leaderboard, allowing users to view scores filtered by the year the test was taken. The year is extracted from the `takenAt` date field in the database using SQL functions.

## What Was Added

### Backend Changes

#### `src/server/api/routers/written.ts` (MODIFIED)

Added three new capabilities:

1. **Updated `getLeaderboard` query** to accept optional `year` parameter
   - Uses PostgreSQL's `EXTRACT(YEAR FROM date)` SQL function
   - Filters scores by year when provided
   - Works in combination with existing competition filter
   ```typescript
   // Example query with year filter
   if (year) {
       conditions.push(
           sql`EXTRACT(YEAR FROM ${writtenTests.takenAt}) = ${year}`,
       );
   }
   ```

2. **New `getAvailableYears` query**
   - Returns array of distinct years from all written tests
   - Extracts years using SQL: `EXTRACT(YEAR FROM takenAt)`
   - Sorted in descending order (newest first)
   - Only includes years from users with `showScoresInLeaderboard = true`
   ```typescript
   api.written.getAvailableYears.useQuery()
   // Returns: [2024, 2023, 2022, ...]
   ```

3. **New `getMostRecentYear` query**
   - Returns the most recent year from written test dates
   - Used to auto-select default year in dropdown
   - Queries by most recent `takenAt` date
   ```typescript
   api.written.getMostRecentYear.useQuery()
   // Returns: 2024 (or whatever the most recent year is)
   ```

### Frontend Changes

#### `src/app/leaderboard/written/written-leaderboard.tsx` (MODIFIED)

Added year filtering UI and logic:

1. **New State Management**
   - `selectedYear` state (number | "all" | undefined)
   - Auto-selects most recent year on component mount
   - Works alongside existing `selectedCompetition` state

2. **New Year Dropdown**
   - Positioned above competition dropdown
   - Shows all available years sorted newest to first
   - Includes "All Years" option to view across all years
   - Auto-populated from `getAvailableYears` query

3. **Enhanced Query Logic**
   - Leaderboard query now includes both `competition` and `year` parameters
   - Query only enabled when both filters are selected
   - Supports combinations:
     - Specific year + Specific competition
     - Specific year + All competitions
     - All years + Specific competition
     - All years + All competitions

## User Interface

### New Layout Order
```
┌─────────────────────────────────────┐
│  Written Test Leaderboard           │
├─────────────────────────────────────┤
│  Year: [2024 ▼]                     │
├─────────────────────────────────────┤
│  Competition: [VCM-1 ▼]             │
├─────────────────────────────────────┤
│  Search: [____________]             │
├─────────────────────────────────────┤
│  Rank | Username | Score            │
│  1    | Alice    | 95               │
│  2    | Bob      | 87               │
└─────────────────────────────────────┘
```

## Filter Combinations & Behavior

| Year Filter | Competition Filter | Result |
|-------------|-------------------|---------|
| 2024 | VCM-1 | Scores from VCM-1 tests taken in 2024 only |
| 2024 | All Competitions | All scores from 2024 across all competitions |
| All Years | VCM-1 | All VCM-1 scores across all years |
| All Years | All Competitions | All scores from all tests ever |

## SQL Implementation Details

### Year Extraction
The backend uses PostgreSQL's `EXTRACT` function to get the year from the date:

```sql
EXTRACT(YEAR FROM written_tests.takenAt) = 2024
```

This approach:
- ✅ Works with existing date column (no schema changes needed)
- ✅ Leverages database-level date functions for efficiency
- ✅ Returns proper integer year values
- ✅ Compatible with PostgreSQL date types

### Query Performance
- Date extraction happens at database level (efficient)
- Uses existing indexes on `userId` and `competition` fields
- Year filtering adds minimal overhead
- Results are cached by React Query/tRPC

## Default Behavior

When the leaderboard page loads:

1. Fetches available years → [2024, 2023, 2022, ...]
2. Fetches most recent year → 2024
3. Auto-selects **most recent year** in dropdown
4. Fetches available competitions → [VCM-1, VCM-2, ...]
5. Fetches most recent competition → VCM-1
6. Auto-selects **most recent competition** in dropdown
7. Displays leaderboard for that year + competition

This ensures users immediately see the most relevant, recent data.

## Type Safety

All new queries maintain full type safety:

```typescript
// Input types
type GetLeaderboardInput = {
  competition?: "VCM-1" | "VCM-2" | ... | undefined;
  year?: number | undefined;
}

// Output types
type GetAvailableYearsOutput = number[];
type GetMostRecentYearOutput = number | null;
```

## Edge Cases Handled

1. **No scores for selected year**: Shows "No results found" message
2. **No years available**: Dropdown shows empty (shouldn't happen with data)
3. **Most recent year query returns null**: Fallback to undefined (all years)
4. **Year changes while loading**: React Query cancels old request automatically
5. **Both filters set to "All"**: Shows aggregated scores across everything

## Integration with Existing Features

The year filtering works seamlessly with:
- ✅ Competition filtering (combined AND logic)
- ✅ Name search (applied after filters)
- ✅ Privacy settings (only shows users with showScoresInLeaderboard)
- ✅ Score aggregation (totals per user for filtered set)
- ✅ Ranking (re-calculated based on filtered scores)

## User Experience Benefits

1. **Relevant Data**: Auto-selection shows most recent scores first
2. **Historical View**: Can view past years' performance
3. **Flexible Analysis**: 
   - Compare same competition across years
   - View yearly performance across competitions
   - See all-time totals
4. **Fast Filtering**: Instant updates when changing filters
5. **Clear Labels**: "Year" and "Competition" clearly labeled above dropdowns

## API Examples

```typescript
// Component usage
const WrittenLeaderboard = () => {
  const [selectedYear, setSelectedYear] = useState<number | "all" | undefined>();
  
  // Get available years
  const { data: years } = api.written.getAvailableYears.useQuery();
  // Returns: [2024, 2023, 2022]
  
  // Get most recent year
  const { data: mostRecentYear } = api.written.getMostRecentYear.useQuery();
  // Returns: 2024
  
  // Get leaderboard with filters
  const { data: scores } = api.written.getLeaderboard.useQuery({
    competition: "VCM-1",
    year: 2024
  });
  // Returns: [{ id: "user1", name: "Alice", score: 95 }, ...]
};
```

## Testing Scenarios

- [x] Year dropdown populates with correct years
- [x] Most recent year is auto-selected
- [x] Changing year updates leaderboard
- [x] "All Years" shows scores across all years
- [x] Year + Competition filters work together
- [x] Search works with year filtering
- [x] No scores message appears when year has no data
- [x] SQL EXTRACT function works correctly with database
- [x] Type safety maintained throughout

## Files Modified

1. `src/server/api/routers/written.ts`
   - Added `year` parameter to `getLeaderboard`
   - Added `getAvailableYears` query
   - Added `getMostRecentYear` query

2. `src/app/leaderboard/written/written-leaderboard.tsx`
   - Added `selectedYear` state
   - Added year dropdown UI
   - Added auto-selection logic for year
   - Updated query to include year parameter

3. `WRITTEN_LEADERBOARD_FEATURE.md`
   - Updated documentation with year filtering details

## Future Enhancements

Potential additions building on this feature:
- Date range picker (start date to end date)
- Year-over-year comparison charts
- "Previous Year" / "Next Year" navigation buttons
- School year filtering (e.g., "2023-2024")
- Multi-year selection for trends