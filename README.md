# Photo Wheel Spinner PWA

A progressive web application for creating customizable spinning wheel games using user-uploaded photos.

## Implementation Plan

### Phase 1: Core Infrastructure & Data Management

#### 1.1 Project Setup
- Set up PWA structure with manifest.json and service worker
- Create basic HTML5 structure with CSS3 styling
- Implement responsive, mobile-first design framework

#### 1.2 Data Storage Layer
- **LocalStorage**: Gallery metadata, categories, photo references, settings
- **IndexedDB**: Photo blob storage for performance and size handling
- Create data access layer with CRUD operations
- Implement unique ID generation for galleries, categories, and photos

#### 1.3 Core Data Models
```javascript
Gallery {
  galleryId: string,
  name: string,
  spinMode: 'static' | 'consume',
  categories: Category[],
  photos: Photo[]
}

Category {
  categoryId: string,
  name: string,
  color: string (hex)
}

Photo {
  photoId: string,
  chance: number,
  categoryId: string
}
```

### Phase 2: Gallery Management System

#### 2.1 Gallery CRUD Operations
- Create new gallery with unique name
- List all galleries on main screen
- Edit gallery name and settings
- Delete gallery with confirmation

#### 2.2 Category Management
- Create categories with name and color picker
- Edit existing categories
- Delete categories (photos become uncategorized)
- Color validation and picker UI

#### 2.3 Photo Management
- File upload interface for multiple photos
- Photo-to-category assignment dropdown
- Chance value input with validation
- Photo removal functionality
- Image preview and management UI

### Phase 3: Game Configuration & Core Logic

#### 3.1 Spin Mode Configuration
- Static mode: Chances remain unchanged
- Consume mode: Winning photo chances reduce by 1

#### 3.2 Weighted Random Algorithm
- Implement probability-based selection
- Handle edge cases (zero chances, empty galleries)
- Session state management for consume mode

### Phase 4: Spinning Wheel UI & Animation

#### 4.1 Dynamic Wheel Generation
- Generate wheel segments based on photos and categories
- Apply category colors to segments
- Calculate segment sizes based on weighted chances

#### 4.2 Wheel Animation System
- 60fps spinning animation
- Physics-based deceleration
- Visual feedback for winning selection
- Smooth transitions and effects

#### 4.3 Results Display
- Prominent winning photo display
- Animation and celebration effects
- Session management for consume mode

### Phase 5: PWA Features & Polish

#### 5.1 Progressive Web App Implementation
- Service worker for offline capability
- Web app manifest for installability
- Caching strategies for assets and data

#### 5.2 Responsive Design & UX
- Mobile-first responsive layout
- Touch-friendly interactions
- Loading states and error handling
- Accessibility compliance

#### 5.3 Session Management
- Play session state tracking
- Reset session functionality for consume mode
- Navigation between game and management screens

## Technical Specifications

### Technology Stack
- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Storage**: LocalStorage + IndexedDB
- **Architecture**: PWA with Service Worker

### Browser Compatibility
- Chrome, Firefox, Safari, Edge (latest versions)
- Desktop and mobile platforms
- Full offline functionality

### Performance Targets
- 60fps animations
- Fast photo loading from IndexedDB
- Responsive UI interactions
- Minimal memory footprint

## Project Structure
```
/
├── index.html              # Main app entry point
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── css/
│   ├── main.css           # Core styles
│   ├── gallery.css        # Gallery management
│   ├── wheel.css          # Spinning wheel
│   └── responsive.css     # Mobile responsiveness
├── js/
│   ├── app.js             # Main application logic
│   ├── storage.js         # LocalStorage + IndexedDB layer
│   ├── gallery.js         # Gallery management
│   ├── wheel.js           # Spinning wheel logic
│   ├── animation.js       # Wheel animations
│   └── utils.js           # Utility functions
└── assets/
    ├── icons/             # PWA icons
    └── images/            # UI assets
```

## Development Phases

1. **Phase 1-2**: Core infrastructure and data management
2. **Phase 3**: Game logic and configuration
3. **Phase 4**: Spinning wheel and animations 
4. **Phase 5**: PWA features and polish 

Each phase builds upon the previous one, ensuring a working application at each milestone.
