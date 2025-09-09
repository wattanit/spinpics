// Core data models based on requirements.md specification

export type SpinMode = 'static' | 'consume';

export interface Category {
  categoryId: string;
  name: string;
  color: string; // hex color code
}

export interface Photo {
  photoId: string;
  chance: number;
  categoryId: string;
  // Note: actual image blob stored in IndexedDB, referenced by photoId
}

export interface Gallery {
  galleryId: string;
  name: string;
  spinMode: SpinMode;
  categories: Category[];
  photos: Photo[];
}

// Session state for consume mode
export interface PlaySession {
  galleryId: string;
  spinMode: SpinMode;
  currentChances: Map<string, number>; // photoId -> current chance
  originalChances: Map<string, number>; // photoId -> original chance
  wheelSegments: WheelSegment[]; // Fixed wheel arrangement for the session
  consumedSegments: Set<string>; // Specific segment IDs consumed (for visual removal)
}

// UI State management
export interface AppState {
  currentScreen: 'home' | 'gallery' | 'play';
  currentGallery: Gallery | null;
  playSession: PlaySession | null;
  galleries: Gallery[];
}

// Storage layer interfaces
export interface StorageManager {
  // Gallery operations
  getAllGalleries(): Promise<Gallery[]>;
  getGallery(galleryId: string): Promise<Gallery | null>;
  saveGallery(gallery: Gallery): Promise<void>;
  deleteGallery(galleryId: string): Promise<void>;
  
  // Photo blob operations
  savePhoto(photoId: string, blob: Blob): Promise<void>;
  getPhoto(photoId: string): Promise<Blob | null>;
  deletePhoto(photoId: string): Promise<void>;
}

// Wheel rendering
export interface WheelSegment {
  photoId: string;
  photo: Blob;
  category: Category;
  chance: number;
  startAngle: number;
  endAngle: number;
  normalizedChance: number; // 0-1 based on total chances
}

// Animation state
export interface SpinAnimation {
  isSpinning: boolean;
  currentAngle: number;
  targetAngle: number;
  velocity: number;
  startTime: number;
  duration: number;
}

// Event types for app communication
export type AppEvents = {
  'gallery-created': { gallery: Gallery };
  'gallery-updated': { gallery: Gallery };
  'gallery-deleted': { galleryId: string };
  'photo-added': { galleryId: string; photo: Photo };
  'photo-removed': { galleryId: string; photoId: string };
  'category-created': { galleryId: string; category: Category };
  'category-updated': { galleryId: string; category: Category };
  'category-deleted': { galleryId: string; categoryId: string };
  'spin-started': { galleryId: string };
  'spin-completed': { galleryId: string; winningPhoto: Photo };
  'session-reset': { galleryId: string };
  'screen-changed': { screen: AppState['currentScreen'] };
};

// Utility types
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;