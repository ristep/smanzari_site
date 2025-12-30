# Album Management Frontend

## Overview

A complete album management interface has been added to the React SPA frontend for organizing and managing media collections.

## New Files Created

### 1. **AlbumManager Page Component**
- **Location**: `src/pages/AlbumManager/index.jsx`
- **Features**:
  - Create new albums with title and description
  - View all user albums
  - Add media files to albums
  - Remove media files from albums
  - Delete albums (soft delete)
  - Search and filter media when adding
  - Expandable album details view

### 2. **AlbumManager Styles**
- **Location**: `src/pages/AlbumManager/index.module.scss`
- **Features**:
  - Responsive grid layout
  - Dark/light theme support using CSS variables
  - Mobile-friendly design
  - Smooth transitions and hover effects
  - Card-based UI for albums and media

## Files Modified

### 1. **src/routes/index.jsx**
- Added AlbumManager to imports
- Added new route: `/albums` -> AlbumManager component

### 2. **src/pages/index.jsx**
- Exported AlbumManager component

### 3. **src/components/Navbar/index.jsx**
- Added "Albums" navigation link (visible when logged in)
- Added to both desktop and mobile navigation
- Route: `/albums`

## Component Architecture

### AlbumManager Component

**State Management**:
- `showCreateForm` - Toggle create album form
- `formData` - Album title and description
- `selectedAlbum` - Currently expanded album
- `showAddMediaForm` - Toggle add media form
- `mediaSearch` - Search term for filtering media

**React Query Hooks**:
- `useQuery` - Fetch user albums and available media
- `useMutation` - Create, delete, add/remove media operations
- `useQueryClient` - Cache invalidation

**Features**:
1. **Create Album**
   - Form with title (required) and description (optional)
   - Form validation
   - Loading state during submission
   - Cache invalidation after success

2. **View Albums**
   - List all user albums
   - Display album info (title, description, media count)
   - Expandable details view
   - Empty state message

3. **Album Details**
   - View media files in album
   - Search and add media
   - Remove media from album
   - Loading states for operations

4. **Media Management**
   - Search media files by filename
   - Add media with visual feedback
   - Remove media with confirmation
   - Display media in grid layout

## API Integration

### Endpoints Used

**Albums**:
- `GET /albums` - Get user's albums
- `POST /albums` - Create new album
- `GET /albums/:id` - Get album details
- `PUT /albums/:id` - Update album
- `DELETE /albums/:id` - Delete album
- `POST /albums/:id/media` - Add media to album
- `DELETE /albums/:id/media` - Remove media from album

**Media**:
- `GET /media?limit=1000` - Get all media files (for adding to albums)

## UI/UX Features

### Album Card
- Title and description display
- Media count indicator
- View/Hide details toggle
- Delete button

### Album Details Section
- Media grid display
- Add media button with search
- Remove media buttons for each file
- Responsive grid layout

### Create Album Form
- Title input field (required)
- Description textarea (optional)
- Submit button with loading state
- Cancel button

### Add Media Section
- Search/filter input
- Scrollable media list
- Add buttons for each media file
- Visual feedback during operation

## Styling

### CSS Variables Used
- `--bg-primary` - Primary background
- `--bg-secondary` - Secondary background
- `--text-primary` - Primary text
- `--text-secondary` - Secondary text
- `--text-tertiary` - Tertiary text
- `--border-color` - Border color
- `--accent-color` - Accent/highlight color
- `--shadow-color` - Shadow color

### Responsive Breakpoints
- Mobile: < 768px
- Tablet: ≥ 768px
- Desktop: ≥ 1024px

### Classes
- `.container` - Main container with max-width
- `.albumsList` - Flex column layout for albums
- `.albumCard` - Individual album card
- `.mediaGrid` - Responsive grid for media items
- `.createForm` - Album creation form styling
- `.mediaList` - Scrollable media list

## Usage

### For Users
1. Navigate to "Albums" in the navbar (when logged in)
2. Click "New Album" to create an album
3. Enter title and optional description
4. Click "Create Album"
5. Click "View" on an album to see details
6. Click "+" to add media to the album
7. Search for media files and click "Add"
8. Remove media by clicking the "X" button
9. Delete album by clicking the trash icon

### For Developers
```jsx
import AlbumManager from '@/pages/AlbumManager';

// Component is already integrated in routes
// Access via /albums route when authenticated
```

## Error Handling

- Network errors displayed via alerts
- Loading states for all operations
- Cache invalidation for consistency
- Form validation for required fields

## Future Enhancements

- Edit album title/description
- Bulk operations (add multiple media at once)
- Album sharing/permissions
- Album cover image selection
- Album sorting and filtering
- Download entire album
- Album statistics (total size, media count)
