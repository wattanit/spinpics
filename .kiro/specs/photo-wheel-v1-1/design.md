# Design Document - Photo Wheel Spinner v1.1

## Overview

Version 1.1 of the Photo Wheel Spinner introduces two key enhancements that improve user interaction and visual organization: a lightbox photo viewer and gallery cover photo selection. These features build upon the existing TypeScript/Canvas-based architecture while maintaining the app's core principles of privacy, offline capability, and performance.

The design leverages the existing component structure (App class, Storage layer, UI patterns) and extends them with new UI components and data model enhancements. All new functionality maintains backward compatibility with v1.0 data structures.

## Architecture

### High-Level Component Structure

```
App (main controller)
├── LightboxManager (new) - Handles photo viewing and downloads
├── CoverPhotoManager (new) - Manages gallery cover photo selection
├── Storage (extended) - Enhanced with cover photo persistence
├── UI Components (extended)
│   ├── Gallery Cards (enhanced with cover photos)
│   ├── Photo Management (enhanced with cover selection)
│   └── Lightbox Modal (new)
└── Existing Components (unchanged)
    ├── WheelEngine
    ├── WheelRenderer
    └── Category Management
```

### Data Flow

1. **Lightbox Flow**: User clicks reward photo → LightboxManager creates overlay → Photo displayed with download option
2. **Cover Photo Flow**: User selects cover in gallery management → CoverPhotoManager updates gallery data → Storage persists changes → UI updates gallery cards

## Components and Interfaces

### 1. LightboxManager Class

**Purpose**: Manages the lightbox overlay for photo viewing and downloading.

**Key Methods**:
```typescript
class LightboxManager {
  private overlay: HTMLElement | null = null;
  
  // Core functionality
  openLightbox(photoBlob: Blob, photoId: string, galleryName?: string): void
  closeLightbox(): void
  downloadPhoto(photoBlob: Blob, filename: string): void
  
  // Event handling
  private setupEventListeners(): void
  private handleKeyboardEvents(event: KeyboardEvent): void
  private handleOverlayClick(event: MouseEvent): void
  
  // UI management
  private createLightboxHTML(photoBlob: Blob, photoId: string): string
  private preventBodyScroll(prevent: boolean): void
}
```

**Integration Points**:
- Called from App class when reward photo is clicked
- Called from photo management interface for preview
- Uses existing photo blob data from Storage

### 2. CoverPhotoManager Class

**Purpose**: Handles cover photo selection and management for galleries.

**Key Methods**:
```typescript
class CoverPhotoManager {
  private storage: StorageManager;
  
  // Core functionality
  setCoverPhoto(galleryId: string, photoId: string): Promise<void>
  getCoverPhotoBlob(gallery: Gallery): Promise<Blob | null>
  getDefaultCoverPhoto(gallery: Gallery): Promise<Blob | null>
  
  // UI helpers
  renderCoverPhotoSelector(gallery: Gallery, container: HTMLElement): Promise<void>
  updateGalleryCardCover(galleryId: string, photoBlob: Blob): void
  
  // Data management
  private validateCoverPhoto(gallery: Gallery, photoId: string): boolean
  private handleCoverPhotoDeleted(gallery: Gallery): Promise<void>
}
```

**Integration Points**:
- Integrated into existing gallery management UI
- Uses Storage layer for persistence
- Updates gallery cards in home screen

### 3. Enhanced Gallery Interface

**Extended Data Model**:
```typescript
interface Gallery {
  galleryId: string;
  name: string;
  spinMode: SpinMode;
  categories: Category[];
  photos: Photo[];
  coverPhotoId?: string; // New field for v1.1
}
```

**Migration Strategy**:
- Existing galleries without `coverPhotoId` use first photo or default placeholder
- No breaking changes to existing data structures
- Graceful fallback for missing cover photos

### 4. Lightbox UI Component

**HTML Structure**:
```html
<div id="lightbox-overlay" class="lightbox-overlay">
  <div class="lightbox-container">
    <button class="lightbox-close">&times;</button>
    <div class="lightbox-content">
      <img class="lightbox-image" src="..." alt="Photo">
      <div class="lightbox-controls">
        <button class="lightbox-download">Download</button>
        <button class="lightbox-set-cover" style="display: none;">Set as Cover</button>
      </div>
    </div>
  </div>
</div>
```

**CSS Classes**:
- `.lightbox-overlay` - Full-screen dark overlay with z-index management
- `.lightbox-container` - Centered container with responsive sizing
- `.lightbox-image` - Responsive image with max dimensions
- `.lightbox-controls` - Action buttons positioned at bottom

### 5. Enhanced Gallery Cards

**Updated HTML Structure**:
```html
<div class="gallery-card" data-gallery-id="${galleryId}">
  <div class="gallery-cover">
    <img src="..." alt="Gallery cover" class="cover-image">
    <div class="gallery-overlay">
      <h3>${galleryName}</h3>
      <p>${photoCount} photos • ${categoryCount} categories</p>
    </div>
  </div>
  <div class="gallery-actions">
    <button class="btn btn-outline">Edit</button>
    <button class="btn btn-primary">Play</button>
  </div>
</div>
```

## Data Models

### 1. Extended Gallery Model

```typescript
interface Gallery {
  galleryId: string;
  name: string;
  spinMode: SpinMode;
  categories: Category[];
  photos: Photo[];
  coverPhotoId?: string; // Optional - defaults to first photo or placeholder
}
```

### 2. Lightbox Configuration

```typescript
interface LightboxConfig {
  photoBlob: Blob;
  photoId: string;
  galleryName?: string;
  showCoverOption?: boolean; // Show "Set as Cover" button
  onCoverSet?: (photoId: string) => void; // Callback for cover selection
}
```

### 3. Cover Photo State

```typescript
interface CoverPhotoState {
  galleryId: string;
  coverPhotoId: string | null;
  coverPhotoBlob: Blob | null;
  isDefault: boolean; // True if using default/fallback cover
}
```

## Error Handling

### 1. Lightbox Error Scenarios

- **Missing Photo Blob**: Display error message in lightbox, provide close option
- **Download Failure**: Show browser-native error, maintain lightbox state
- **Keyboard Navigation**: Ensure ESC key always works to close lightbox

**Implementation**:
```typescript
private handlePhotoLoadError(): void {
  const errorHTML = `
    <div class="lightbox-error">
      <p>Failed to load photo</p>
      <button class="btn btn-primary" onclick="lightboxManager.closeLightbox()">Close</button>
    </div>
  `;
  // Replace lightbox content with error message
}
```

### 2. Cover Photo Error Scenarios

- **Cover Photo Deleted**: Automatically select next available photo or default
- **Invalid Cover Photo ID**: Clear invalid reference, use fallback
- **Storage Failure**: Show error message, maintain current cover

**Implementation**:
```typescript
async handleCoverPhotoDeleted(gallery: Gallery): Promise<void> {
  if (gallery.coverPhotoId && !gallery.photos.find(p => p.photoId === gallery.coverPhotoId)) {
    // Cover photo was deleted, select new one
    gallery.coverPhotoId = gallery.photos.length > 0 ? gallery.photos[0].photoId : undefined;
    await this.storage.saveGallery(gallery);
  }
}
```

### 3. Migration Error Handling

- **Data Corruption**: Graceful fallback to v1.0 behavior
- **Storage Quota**: Inform user, provide cleanup options
- **Browser Compatibility**: Feature detection for download functionality

## Testing Strategy

### 1. Unit Testing

**LightboxManager Tests**:
- Photo display functionality
- Download mechanism
- Keyboard event handling
- Overlay click behavior
- Error state handling

**CoverPhotoManager Tests**:
- Cover photo selection and persistence
- Default cover photo logic
- Gallery card updates
- Data migration scenarios

### 2. Integration Testing

**End-to-End Workflows**:
- Complete lightbox interaction (open → view → download → close)
- Cover photo selection workflow (select → save → verify display)
- Gallery management with cover photos
- Backward compatibility with v1.0 galleries

### 3. Browser Testing

**Cross-Browser Compatibility**:
- Download functionality across browsers
- Lightbox display and interaction
- Touch/mobile interaction testing
- Keyboard accessibility

**Performance Testing**:
- Large photo handling in lightbox
- Gallery card rendering with cover photos
- Memory usage with multiple lightboxes

### 4. Accessibility Testing

**Keyboard Navigation**:
- Tab order through lightbox controls
- ESC key functionality
- Focus management when opening/closing lightbox

**Screen Reader Support**:
- Alt text for cover photos and lightbox images
- ARIA labels for interactive elements
- Proper heading structure

## Implementation Approach

### Phase 1: Core Infrastructure
1. Create LightboxManager and CoverPhotoManager classes
2. Extend Gallery interface with coverPhotoId field
3. Update Storage layer to handle cover photo persistence
4. Add CSS styles for lightbox and enhanced gallery cards

### Phase 2: Lightbox Implementation
1. Implement lightbox HTML structure and styling
2. Add click handlers to reward photos and photo management
3. Implement download functionality with proper filename generation
4. Add keyboard and overlay click event handling

### Phase 3: Cover Photo Implementation
1. Add cover photo selection UI to photo management
2. Update gallery card rendering with cover photos
3. Implement default cover photo logic
4. Add cover photo validation and error handling

### Phase 4: Integration and Polish
1. Integrate lightbox with existing photo management workflows
2. Add "Set as Cover" option to lightbox when in management mode
3. Implement data migration for existing galleries
4. Add loading states and error handling

### Phase 5: Testing and Optimization
1. Comprehensive testing across browsers and devices
2. Performance optimization for large photos
3. Accessibility improvements
4. Documentation updates

## Technical Considerations

### 1. Performance Optimizations

**Image Loading**:
- Lazy loading for gallery cover photos
- Image compression for cover photo thumbnails
- Blob URL management and cleanup

**Memory Management**:
- Proper cleanup of blob URLs
- Lightbox instance management
- Event listener cleanup

### 2. Mobile Considerations

**Touch Interactions**:
- Touch-friendly lightbox controls
- Swipe gestures for lightbox navigation (future enhancement)
- Responsive cover photo sizing

**Performance on Mobile**:
- Optimized image sizes for mobile displays
- Touch event handling
- Battery usage considerations

### 3. Browser Compatibility

**Download Functionality**:
- Feature detection for download attribute
- Fallback for older browsers
- Proper MIME type handling

**Modern Web APIs**:
- Blob URL support verification
- Canvas toBlob compatibility
- File API support checking

This design maintains the existing architecture's strengths while adding the requested functionality in a clean, maintainable way. The modular approach ensures that the new features integrate seamlessly with existing workflows while providing room for future enhancements.