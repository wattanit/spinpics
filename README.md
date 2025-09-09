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
