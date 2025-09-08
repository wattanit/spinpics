# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Photo Wheel Spinner Progressive Web Application (PWA) - a pure frontend application for creating customizable spinning wheel games using user-uploaded photos. The project is in its initial setup phase with only requirements and implementation plan defined.

## Architecture & Technical Stack

### Core Architecture
- **Pure Frontend PWA**: HTML5, CSS3, JavaScript (ES6+) only - no backend server
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

### Core Business Logic
- **Weighted Random Selection**: Probability-based photo selection using chance values
- **Session State Management**: Tracking consumed chances in "Consume" mode
- **Dynamic Wheel Generation**: Real-time segment creation based on photos and categories

## Development Context

### Current State  
- **Completed**: PWA foundation with HTML5 structure, manifest, and service worker
- **Files Implemented**: 
  - `index.html` - Complete UI structure with 3 screens and modal dialogs
  - `manifest.json` - PWA configuration for installability  
  - `sw.js` - Service worker with offline caching strategy
- **Next Phase**: Data storage layer (LocalStorage + IndexedDB implementation)

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
1. **Phase 1-2**: Core infrastructure and data management
2. **Phase 3**: Game logic and configuration  
3. **Phase 4**: Spinning wheel and animations
4. **Phase 5**: PWA features and polish

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

### Pending JavaScript Implementation
All `.js` files referenced in HTML are not yet implemented:
- `js/app.js` - Main application logic and screen management
- `js/storage.js` - LocalStorage + IndexedDB data layer
- `js/gallery.js` - Gallery CRUD operations
- `js/wheel.js` - Spinning wheel logic and weighted selection
- `js/animation.js` - 60fps wheel animations
- `js/utils.js` - Utility functions and helpers