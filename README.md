# SpinPics

<img src="./spinpics-icon.png" alt="SpinPics Logo" width="400">

A progressive web application for creating customizable spinning wheel games with your photos.

## Features

- **Progressive Web App** - Install on any device, works offline
- **Photo Management** - Upload and organize your photos into categories
- **Spinning Wheel Game** - Physics-based wheel with weighted probabilities
- **Customizable Categories** - Color-coded organization for your photos
- **Two Game Modes**:
  - **Static Mode**: Chances stay the same for every spin
  - **Consume Mode**: Winning photos reduce their chances over time
- **Mobile-First Design** - Optimized for touch devices
- **Fast & Lightweight** - Only ~53KB total bundle size

## Quick Start

1. **Try it online** or **install as PWA** from your browser
2. **Create a gallery** and give it a name
3. **Upload photos** and organize them into colored categories
4. **Set chance values** for each photo (higher = more likely to win)
5. **Start spinning** and enjoy the game!

## How to Play

1. **Gallery Setup**: Create galleries to organize different sets of photos
2. **Add Photos**: Upload images and assign them to categories with custom colors
3. **Set Chances**: Give each photo a chance value (1-99) - higher numbers = more likely to win
4. **Choose Mode**: 
   - Static: Same odds every spin
   - Consume: Winners get reduced chances
5. **Spin**: Watch the wheel spin and see which photo wins!

## Development

### Getting Started
```bash
git clone <repository>
cd photo-wheel-spinner
npm install
npm run dev
```

### Commands
- `npm run dev` - Development server with hot reload
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run lint` - Code quality check
- `npm run type-check` - TypeScript validation

### Technology Stack
- **Frontend**: Vite + TypeScript + HTML5 + CSS3
- **Storage**: LocalStorage + IndexedDB
- **Architecture**: PWA with Service Worker
- **Performance**: 60fps animations, offline-first

---

## Development Details

<details>
<summary>Implementation Plan & Technical Details</summary>

### Phase 1: Core Infrastructure & Data Management ✅

#### 1.1 Project Setup ✅
- Vite + TypeScript PWA with modern tooling
- Complete HTML5 structure with responsive design
- PWA configuration with manifest and service worker

#### 1.2 Data Storage Layer ✅
- LocalStorage for gallery metadata
- IndexedDB for photo blob storage
- CRUD operations with error handling

#### 1.3 Core Data Models ✅
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

### Phase 2: Gallery Management System ✅
- Complete CRUD operations for galleries
- Category management with color picker
- Photo upload and organization
- Tabbed interface with responsive design

### Phase 3: Game Configuration & Core Logic ✅
- Weighted random algorithm implementation
- Static vs Consume mode configuration
- Session state management
- Interactive gameplay with result display

### Phase 4: Spinning Wheel UI & Animation ✅
- 60fps canvas-based wheel rendering
- Physics-based spinning animation
- Dynamic segment generation
- Authentic winner determination

### Phase 5: Final Polish & Optimization ✅
- Complete PWA implementation with offline support
- Performance optimization (~53KB bundle)
- Mobile UX improvements
- Professional branding and icon set

### Browser Compatibility
- Chrome, Firefox, Safari, Edge (latest versions)
- Desktop and mobile platforms
- Full offline functionality

### Version 1.1 Development Plan

#### Phase 6: Photo Lightbox Feature ✅ COMPLETED
- [x] 6.1 Add lightbox modal HTML structure and CSS styling
- [x] 6.2 Implement click handler for winning photos
- [x] 6.3 Create photo display with full-size view
- [x] 6.4 Add download functionality using blob URLs
- [x] 6.5 Implement close handlers (ESC key, outside click, close button)

#### Phase 7: Gallery Cover Photo Selection ✅ COMPLETED
- [x] 7.1 Update Gallery TypeScript interface with `coverPhotoId?` field
- [x] 7.2 Add cover photo selection UI in gallery settings tab
- [x] 7.3 Update gallery card display to show cover photos
- [x] 7.4 Implement auto-default to first photo logic
- [x] 7.5 Update storage operations to handle cover photo field

#### Technical Implementation Details

**Lightbox Modal Structure:**
```html
<!-- Photo Lightbox Modal -->
<div id="photo-lightbox-modal" class="modal lightbox-modal">
  <div class="lightbox-content">
    <button class="lightbox-close">&times;</button>
    <img id="lightbox-image" class="lightbox-photo" alt="Winning photo">
    <div class="lightbox-controls">
      <button id="download-photo-btn" class="btn btn-primary">Download</button>
    </div>
  </div>
</div>
```

**Gallery Interface Update:**
```typescript
interface Gallery {
  galleryId: string;
  name: string;
  spinMode: SpinMode;
  categories: Category[];
  photos: Photo[];
  coverPhotoId?: string; // New in v1.1
}
```

**Key Implementation Areas:**
- `src/types/index.ts` - Add coverPhotoId to Gallery interface
- `index.html` - Add lightbox modal structure
- `src/style.css` - Add lightbox and gallery cover styles
- `src/app.ts` - Add lightbox handlers and cover photo logic
- `src/lib/storage.ts` - Update gallery save/load for cover photos
