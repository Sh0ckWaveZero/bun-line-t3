# Pull Request: Calendar Holidays Management System

## Summary

- **PWA Support**: Added Progressive Web App manifest and service worker for mobile installation and offline support
- **Thai Buddhist Calendar**: Implemented custom date picker component with Thai calendar (BE 2567+), Thai month names, and weekday localization
- **Holiday Management**: Created comprehensive CRUD system for Thai public holidays with add/edit/delete functionality via modal interface
- **Holiday Import**: Built file import system supporting JSON and CSV formats with preview and template downloads
- **Leave Request System**: Added employee leave request submission with date picker and leave type selection (personal/sick/vacation)
- **Mobile-Optimized Calendar**: Created dedicated `/calendar/mobile` route with responsive design optimized for mobile screens
- **Desktop Calendar**: Built full-featured `/calendar` route with holiday display, leave management, and dark mode support
- **API Endpoints**: Implemented RESTful `/api/holidays` endpoints for holiday CRUD operations
- **Navigation Updates**: Added calendar links to desktop and mobile header navigation

### Key Technical Details
- Uses `react-day-picker/buddhist` for Thai Buddhist calendar integration
- Service worker caches calendar pages and API responses for offline access
- PWA manifest includes shortcuts for quick access to calendar and dashboard
- All modals include proper ARIA labels and keyboard navigation support
- Dark mode support across all calendar components

## Testing

**Not run** - Suggested test cases:

- [ ] **PWA Installation**: Verify app can be installed on mobile device and launches in standalone mode
- [ ] **Service Worker**: Test offline functionality - cached pages should load without network
- [ ] **Thai Calendar**: Verify correct Buddhist year (BE) display, Thai month names, and weekday labels
- [ ] **Holiday CRUD**: Test add, edit, delete operations for holidays with proper form validation
- [ ] **Holiday Import**: Upload JSON/CSV files with holiday data, verify preview and import success
- [ ] **Leave Requests**: Submit leave requests with date picker, verify calendar display
- [ ] **Mobile Responsiveness**: Test calendar views on various screen sizes (mobile, tablet, desktop)
- [ ] **Dark Mode**: Toggle dark mode, verify all calendar components render correctly
- [ ] **API Endpoints**: Test `/api/holidays` GET, POST, PUT, DELETE operations
- [ ] **Navigation**: Click calendar links in header, verify navigation to correct routes
