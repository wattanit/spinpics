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
- Project contains only requirements.md and README.md with implementation plan
- No code has been implemented yet
- Ready for Phase 1 development (core infrastructure setup)

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
- Service worker caching strategy for offline functionality
- Weighted probability algorithms for fair game mechanics
- Canvas or CSS-based wheel rendering with smooth animations
- Mobile touch interactions and responsive breakpoints