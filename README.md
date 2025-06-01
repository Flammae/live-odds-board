# Live Odds Board

A real-time sports betting odds board that displays thousands of live matches. Features include live odds updates, score tracking, and efficient handling of large datasets through virtualization.

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0

### Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Generate mock data (required for the application to work):
   ```bash
   pnpm tsx mock/generateMatches.ts
   ```
4. Start the development server:
   ```bash
   pnpm dev
   ```

### VS Code / Cursor Setup

When using VS Code or Cursor, ensure proper TypeScript support:

1. Open any TypeScript file
2. Press `Cmd + Shift + P` (Mac) or `Ctrl + Shift + P` (Windows/Linux)
3. Type "Select TypeScript Version"
4. Choose "Use Workspace Version"

## Task Requirements

The task is to implement live odds board application that displays thousands of live
matches in a virtualized, real-time updating table.

1. Create application with vite+react. Use latest versions
2. Application should display 10000+ live matches.
3. Each row should contain
   Sport icon
   Competitor names
   Match start time
   Current score
   Few betting options, for example 1X2, Double Chance, Total
4. User should be able to select odds by clicking on them
5. Use library like react-window or react-virtualized to implement virtual scrolling
6. Highlight changes during 1 second, green for increased value, red for decreased
7. Selected odds should be highlighted
8. Selected odds should be remembered on scrolling
9. Selected odds should be remembered on page reload
10. Current scroll position should be remembered on page reload
11. Implement mock websocket, which produces random odds changes every predefined interval
12. Upload project to github and make project public.
13. Make application visible using Vercel, for example

---

## Data Spec

Frontend architectural decisions and optimizations are derived from this data spec. This logic is inspired by existing sports betting products.

1. To help with stability of paginated data, the list of games will be sorted by match start time. In real-world applications, data will most likely be sorted by popularity or number of odds placed. In this case, the server would be responsible for maintaining stability of the list (i.e., with historical sort orders and cached data). Since this would change the scope of the task, match start time was chosen for sort order instead.
2. Matches can be inserted or removed at any position in the list. If a match is removed from the list, the server will keep a record of the item but won't make it accessible for the frontend.
3. All 10,000+ matches can update at the same time, live, at the predefined interval. Real-time updates are limited to current score and odds changes.

---

## Functional Spec

### Pagination & Virtualization

- To efficiently handle 10,000+ matches, the data is paginated and rendered using an infinite scroll view.
- **TanStack Query's** `useInfiniteList` is used to manage pagination.
- Pagination uses the "Last Item" as a cursor, preventing duplication when items are added or removed.
- If the "Last Item" is deleted before requesting a new page, the server can still filter using its ID and return the correct page (the deleted item will be omitted).
- In server responses, the "Last Item" is excluded from next pages and included in previous pages.
- If there are no more items in the previous or next page, the server responds with a 404.
- On page refresh, only the current page data is loaded, and the list scrolls to the previous position.
- When scrolling back up, removed items are no longer visible in the infinite list.
- **TanStack Virtual** is used to optimize rendering performance for large lists.
- As the user scrolls near the ends of the list, previous or next pages are automatically requested.

### Websockets

- The frontend manages real-time updates for thousands of matches by subscribing only to visible matches. This is done by sending match IDs to the backend when matches become visible in the viewport.
- To optimize performance, we use TanStack Virtual to only subscribe to matches that are currently visible in the viewport. This prevents unnecessary websocket updates for off-screen matches.
- Match updates are stored in a Zustand store instead of directly updating the list data. This prevents expensive re-renders of the entire list when a single match updates.
- Each match update includes a timestamp. The Match component uses this timestamp to compare with its current data and only shows the newer version, ensuring users always see the most recent information.

### Selected Odds

- Selected odds are saved in localStorage using Zustand
- Old selections (>30 minutes) are automatically cleared on page load

### UX

- When reloading a scrolled page, previous items are only loaded after the user explicitly clicks the "Load Previous Items" button
- A "Go to Start" button appears when the list is scrolled down. This helps users quickly return to the beginning of the list, especially useful when viewing outdated matches after leaving the tab open for an extended period.
- SEO can be improved by updating the URL to reflect the current page in the infinite list. In SSR environments, `useInfiniteList` can be configured to preload the current page, Allowing bots to index the page.

---

## Not Included

1. No backend or databases are involved; all data is mocked on the frontend. No SSR is implemented.
2. Ended matches are not dynamically removed from the table.
3. Odds are not dynamically suspended.
4. Odds calculations do not follow real-life logic.

---
