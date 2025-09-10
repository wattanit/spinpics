# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is SpinPics, a Progressive Web Application (PWA) - a pure frontend application for creating customizable spinning wheel games using user-uploaded photos. The project has completed all development phases and is production-ready.

## Architecture & Technical Stack

### Core Architecture
- **Vite + TypeScript PWA**: Modern tooling with hot reload and type safety - no backend server
- **Data Storage Strategy**: 
  - LocalStorage for metadata (galleries, categories, photo references, settings)
  - IndexedDB for photo blob storage (performance and size handling)
- **Offline-First Design**: Full functionality without internet connection via service worker

### Planned Project Structure
```
/
├── index.html              # Main app entry point
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── css/                    # Stylesheets organized by feature
├── js/                     # JavaScript modules
│   ├── storage.js         # LocalStorage + IndexedDB abstraction layer
│   ├── gallery.js         # Gallery CRUD operations
│   ├── wheel.js           # Spinning wheel logic and weighted algorithms
│   └── animation.js       # 60fps wheel animations
└── assets/                # PWA icons and UI assets
```

### Key Data Models
- **Gallery**: Container with name, spin mode, categories, and photos
- **Category**: Named groups with hex colors for visual organization  
- **Photo**: Stored in IndexedDB with weighted chance values and category assignment
- **Spin Modes**: Static (unchanging probabilities) vs Consume (reducing chances after wins)
- **Double Spin**: Optional feature that can be combined with either mode for dual photo selection

### Core Business Logic
- **Weighted Random Selection**: Probability-based photo selection using chance values
- **Session State Management**: Tracking consumed chances in "Consume" mode
- **Dynamic Wheel Generation**: Real-time segment creation based on photos and categories

## Development Context

### Current State  
- **Completed Phase 1**: Core Infrastructure & Data Management
- **Completed Phase 2**: Gallery Management System  
- **Completed Phase 3**: Game Configuration & Core Logic
- **Completed Phase 4**: Spinning Wheel UI & Animation
- **Completed Phase 5**: Final Polish & Optimization
- **Completed Phase 6**: Photo Lightbox Feature (v1.1) ✅
- **Completed Phase 7**: Gallery Cover Photo Selection (v1.1) ✅
- **Completed Phase 8**: Edit Category Feature (v1.2) ✅
- **Version 1.2 Features**: Edit Category ✅ & Double Spin Mode
- **Files Implemented**: 
  - **Project Foundation**: `package.json`, `tsconfig.json`, `vite.config.ts`, `.eslintrc.cjs`, `src/vite-env.d.ts`
  - **UI Structure**: `index.html` - Complete 3-screen layout with modals, play screen, and responsive design
  - **Application Core**: 
    - `src/main.ts` - Entry point with service worker registration and global app instance
    - `src/app.ts` - Complete App class with gallery management, photo upload, category management, play functionality, and authentic wheel-based winner selection
    - `src/types/index.ts` - Complete TypeScript data models and interfaces including wheel segments and animations
    - `src/style.css` - Comprehensive CSS with gallery management and play screen styles, mobile-first design
  - **Data Layer**: 
    - `src/lib/storage.ts` - Complete StorageManager with LocalStorage + IndexedDB
    - `src/lib/wheel.ts` - Complete WheelEngine with weighted random selection, session management, and fixed wheel generation
    - Gallery persistence, photo blob storage, error handling, and data validation
  - **Animation Layer**:
    - `src/lib/animation.ts` - Complete WheelRenderer with 60fps canvas-based wheel rendering, physics-based spinning, and winner determination
  - **PWA Features**: Automated via vite-plugin-pwa (manifest, service worker, offline support)
- **Status**: Production ready with full PWA capabilities

### Privacy & Storage Requirements
- All user data must remain client-side (no server uploads)
- Photos stored as blobs in IndexedDB for performance
- Gallery metadata in LocalStorage for quick access

### Performance Requirements  
- 60fps animations for spinning wheel
- Responsive mobile-first design
- Fast photo loading from IndexedDB
- Smooth transitions and user interactions

## Development Notes

### Implementation Phases
1. **Phase 1-2**: Core infrastructure and data management (✅ Complete)
2. **Phase 3**: Game logic and configuration (✅ Complete)  
3. **Phase 4**: Spinning wheel and animations (✅ Complete)
4. **Phase 5**: Final polish and optimization (✅ Complete)
5. **Phase 6**: Photo lightbox feature (✅ Complete - v1.1)
6. **Phase 7**: Gallery cover photo selection (✅ Complete - v1.1)

### Critical Technical Considerations
- IndexedDB blob storage implementation for photo management
- Service worker caching strategy for offline functionality (✅ implemented)
- Weighted probability algorithms for fair game mechanics
- Canvas-based wheel rendering with smooth animations (HTML structure ready)
- Mobile touch interactions and responsive breakpoints

## Current Implementation Details

### HTML Structure (index.html)
- **Screen Management**: Home, Gallery, and Play screens with navigation
- **Gallery Management**: Tabbed interface for Photos, Categories, Settings
- **Modal System**: New gallery and category creation dialogs
- **Game Interface**: Canvas for wheel rendering and result display
- **Responsive Layout**: Mobile-first design with semantic HTML5

### PWA Configuration
- **Service Worker**: Cache-first strategy with network fallback
- **Manifest**: Installable PWA with icons, shortcuts, and screenshots
- **Offline Support**: Static assets cached for offline functionality

### Development Environment
- **Commands**:
  - `npm run dev` - Start development server with hot reload
  - `npm run build` - Build for production with PWA features  
  - `npm run preview` - Preview production build
  - `npm run lint` - Run ESLint for code quality
  - `npm run type-check` - Run TypeScript type checking

### Recent Achievements & Bug Fixes
- **Phase 5 - Final Polish & Optimization**:
  - ✅ App rebranded to "SpinPics" with updated manifest, titles, and UI
  - ✅ Complete PWA icon set (192x192, 512x512, favicon, apple-touch-icon)
  - ✅ Production build optimization with 73ms builds and ~53KB bundles
  - ✅ TypeScript type safety with zero warnings across entire codebase
  - ✅ ESLint integration with proper @typescript-eslint configuration
  - ✅ Play screen UX improvement: session stats moved to bottom
  - ✅ Mobile photo display optimization for better visibility
  - ✅ Responsive design fixes for consistent wheel sizing
  - ✅ Service worker with complete offline functionality and asset caching
- **Phase 4 - Spinning Wheel UI & Animation**: 
  - ✅ `src/lib/animation.ts` - 60fps canvas-based wheel rendering with high-DPI support
  - ✅ Dynamic segment generation based on photos and categories with proper weighting
  - ✅ Smooth spinning animation with physics-based deceleration and consistent clockwise rotation
  - ✅ Visual feedback and winning selection animation with category-wide highlighting
  - ✅ Authentic winner determination based on segment under needle position
  - ✅ Fixed wheel arrangement per session with proper consume mode filtering
  - ✅ Animation cleanup to prevent overlapping winner highlights between spins
- **Consume Mode Visual & Logic Fixes**:
  - ✅ Fixed visual gaps by keeping consumed segments visible until next spin
  - ✅ Smart segment removal only when starting new spins (prevents ugly wheel appearance)
  - ✅ Preserved segment order when removing consumed segments (no reshuffling)
  - ✅ Edge case handling for single remaining segment (prevents crashes, keeps game playable)
  - ✅ Enhanced winner detection with fallback logic for floating-point precision issues

### Current Capabilities
- ✅ Gallery creation with name validation and duplicate prevention
- ✅ Persistent storage with IndexedDB for photos and LocalStorage for metadata
- ✅ Complete TypeScript types and error handling
- ✅ Responsive PWA foundation ready for offline use
- ✅ Complete gallery management system with CRUD operations
- ✅ Photo upload, categorization, and chance value management
- ✅ Category creation with color picker and visual organization
- ✅ Gallery settings with spin mode configuration (Static vs Consume)
- ✅ Tabbed interface with responsive mobile-first design
- ✅ Error handling and user feedback throughout the application
- ✅ Complete game logic with weighted random selection algorithms
- ✅ Play session management with consume mode chance tracking
- ✅ Interactive play screen with spin functionality and result display
- ✅ Session statistics and reset functionality
- ✅ Navigation flow between gallery management and gameplay modes
- ✅ **Complete spinning wheel animation system** with 60fps canvas rendering
- ✅ **Authentic wheel physics** with consistent clockwise rotation and realistic deceleration
- ✅ **Visual winner determination** based on segment under needle after spin
- ✅ **Category-wide celebration** highlighting all segments of winning category
- ✅ **Session-based wheel consistency** with fixed arrangement and consume mode filtering
- ✅ **Polished consume mode** with gap-free visual experience and smart segment management
- ✅ **Robust edge case handling** preventing crashes and maintaining playability in all scenarios
- ✅ **Production-ready PWA** with complete offline functionality and installability
- ✅ **Professional branding** as "SpinPics" with optimized user experience
- ✅ **Performance optimized** with lightweight bundles and fast build times
- ✅ **Cross-platform compatibility** with full icon sets and responsive design

## Version 1.1 Development Plan

### Phase 6: Photo Lightbox Feature (✅ Completed)
- **Objective**: Allow users to view and download winning photos in full size
- **Key Components**: ✅ All implemented
  - ✅ Clickable winning photo in result display
  - ✅ Modal lightbox with full-size photo view
  - ✅ Download functionality using blob URLs
  - ✅ Multiple close methods (ESC, outside click, close button)
- **Files Modified**:
  - ✅ `index.html` - Added dedicated lightbox modal structure with separate overlay
  - ✅ `src/style.css` - Added lightbox styling with mobile responsiveness
  - ✅ `src/app.ts` - Implemented complete lightbox event handlers and download functionality
- **Implementation Highlights**:
  - Separate lightbox overlay system to avoid modal conflicts
  - Proper resource management with automatic cleanup
  - Mobile-first responsive design
  - Professional download experience with automatic filename generation

### Phase 7: Gallery Cover Photo Selection (✅ Completed)
- **Objective**: Allow users to set and display cover photos for galleries
- **Key Components**: ✅ All implemented
  - ✅ Gallery interface extension with `coverPhotoId?` field
  - ✅ Cover photo selection UI in gallery settings with live preview
  - ✅ Gallery card display with cover photos on home screen
  - ✅ Auto-default to first photo logic
- **Files Modified**:
  - ✅ `src/types/index.ts` - Updated Gallery interface with coverPhotoId field
  - ✅ `index.html` - Added cover photo selection UI and gallery card structure
  - ✅ `src/style.css` - Added comprehensive gallery cover photo styles
  - ✅ `src/app.ts` - Implemented complete cover photo logic and event handlers
- **Implementation Highlights**:
  - Gallery cards with 180px cover photo areas and hover animations
  - Live preview in settings with 200x120px preview window
  - Dynamic dropdown population and refresh when photos change
  - Smart cleanup when cover photos are deleted
  - Mobile-first responsive design with proper image scaling

### Implementation Guidelines for v1.1
- Maintain existing PWA functionality and performance
- Follow established code patterns and TypeScript conventions
- Ensure mobile-first responsive design
- Test offline functionality remains intact
- Keep bundle size optimization in mind (~53KB target)

## Version 1.2 Development Plan

### Phase 8: Edit Category Feature (✅ Completed)
- **Objective**: Allow users to edit existing category names and colors
- **Key Components**: ✅ All implemented
  - ✅ Edit button for each category in Categories tab
  - ✅ Category edit modal with pre-populated form values
  - ✅ Validation to prevent duplicate category names
  - ✅ Real-time color updates across all UI elements
  - ✅ Preserve photo-category associations during edits
- **Files Modified**:
  - ✅ `index.html` - Added edit category modal structure
  - ✅ `src/app.ts` - Implemented editCategory() and saveEditCategory() methods with validation
  - ✅ Event listeners and state management for category editing
- **Implementation Highlights**:
  - Pre-population of edit form with current category values
  - Duplicate name validation excluding the current category being edited
  - Real-time UI updates across categories list and photos display
  - Proper state management with editingCategoryId tracking

### Phase 9: Double Spin Mode
- **Objective**: Add optional double spin functionality that works with both Static and Consume modes
- **Key Components**:
  - New `doubleSpinEnabled` boolean field in Gallery interface
  - Double spin toggle in gallery settings alongside spin mode selection
  - Category-aware dual selection algorithm for diverse results
  - Sequential wheel animation system for two spins
  - Dual result display for two winning photos
  - Enhanced session state management for dual consume tracking
  - Fallback logic for single-category scenarios

### Data Model Updates for V1.2

```typescript
interface Gallery {
  galleryId: string;
  name: string;
  spinMode: SpinMode; // Remains 'static' | 'consume'
  categories: Category[];
  photos: Photo[];
  coverPhotoId?: string; // v1.1
  doubleSpinEnabled?: boolean; // v1.2 - orthogonal to spinMode
}
```

### Technical Implementation Notes for V1.2

#### Edit Category Feature
- Reuse existing category creation modal architecture
- Implement form pre-population with current category values
- Add real-time color updates with proper CSS variable management
- Maintain data integrity during category modifications
- Test edge cases with photo assignments and color changes

#### Double Spin Mode
- Extend `WheelEngine` class with dual selection algorithms
- Implement category diversity logic: select from different categories when possible
- Update `WheelRenderer` for sequential spin animations
- Modify result display components to accommodate two photos
- Enhance session state for tracking dual consume mode interactions
- Add comprehensive edge case handling for single-category scenarios

### Implementation Guidelines for v1.2
- Maintain existing PWA functionality and performance
- Follow established code patterns and TypeScript conventions
- Ensure mobile-first responsive design for new UI elements
- Test offline functionality remains intact
- Keep bundle size optimization in mind (~53KB target)
- Preserve existing gallery data during migration to new schema
- Maintain backwards compatibility with v1.1 data structures