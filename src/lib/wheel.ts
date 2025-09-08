import { Gallery, Photo, PlaySession, WheelSegment } from '../types/index.js';
import { storage } from '../lib/storage.js';

type StorageManager = typeof storage;

export class WheelEngine {
  private storage: StorageManager;
  
  constructor(storage: StorageManager) {
    this.storage = storage;
  }

  /**
   * Creates a new play session for a gallery
   */
  createPlaySession(gallery: Gallery): PlaySession {
    const currentChances = new Map<string, number>();
    const originalChances = new Map<string, number>();
    
    // Initialize chance maps from gallery photos
    gallery.photos.forEach(photo => {
      currentChances.set(photo.photoId, photo.chance);
      originalChances.set(photo.photoId, photo.chance);
    });
    
    return {
      galleryId: gallery.galleryId,
      spinMode: gallery.spinMode,
      currentChances,
      originalChances
    };
  }

  /**
   * Resets a play session to original chance values
   */
  resetPlaySession(session: PlaySession): PlaySession {
    const newCurrentChances = new Map<string, number>();
    
    // Reset current chances to original values
    session.originalChances.forEach((originalChance, photoId) => {
      newCurrentChances.set(photoId, originalChance);
    });
    
    return {
      ...session,
      currentChances: newCurrentChances
    };
  }

  /**
   * Performs weighted random selection based on current chances
   * Returns the selected photo ID
   */
  spinWheel(session: PlaySession, photos: Photo[]): string | null {
    // Filter photos that have chances > 0
    const eligiblePhotos = photos.filter(photo => {
      const currentChance = session.currentChances.get(photo.photoId) || 0;
      return currentChance > 0;
    });
    
    if (eligiblePhotos.length === 0) {
      return null; // No eligible photos
    }
    
    // Calculate total weight
    const totalWeight = eligiblePhotos.reduce((sum, photo) => {
      return sum + (session.currentChances.get(photo.photoId) || 0);
    }, 0);
    
    if (totalWeight <= 0) {
      return null; // No positive weights
    }
    
    // Generate random number between 0 and totalWeight
    const randomValue = Math.random() * totalWeight;
    
    // Find the selected photo using weighted selection
    let currentWeight = 0;
    for (const photo of eligiblePhotos) {
      const photoChance = session.currentChances.get(photo.photoId) || 0;
      currentWeight += photoChance;
      
      if (randomValue <= currentWeight) {
        return photo.photoId;
      }
    }
    
    // Fallback to last photo (shouldn't happen with proper math)
    return eligiblePhotos[eligiblePhotos.length - 1].photoId;
  }

  /**
   * Updates session state after a spin in consume mode
   * Reduces the winning photo's chance by 1
   */
  updateSessionAfterSpin(session: PlaySession, winningPhotoId: string): PlaySession {
    if (session.spinMode !== 'consume') {
      return session; // No changes needed for static mode
    }
    
    const newCurrentChances = new Map(session.currentChances);
    const currentChance = newCurrentChances.get(winningPhotoId) || 0;
    
    // Reduce chance by 1, minimum 0
    const newChance = Math.max(0, currentChance - 1);
    newCurrentChances.set(winningPhotoId, newChance);
    
    return {
      ...session,
      currentChances: newCurrentChances
    };
  }

  /**
   * Generates wheel segments for rendering
   * Maps photos to visual segments with angles based on current chances
   */
  async generateWheelSegments(session: PlaySession, gallery: Gallery): Promise<WheelSegment[]> {
    const segments: WheelSegment[] = [];
    
    // Create individual segments for each chance instance
    const individualSegments: Array<{photoId: string, category: any, photo: Blob}> = [];
    
    // Generate individual segments for each photo's chances
    for (const photo of gallery.photos) {
      const currentChance = session.currentChances.get(photo.photoId) || 0;
      if (currentChance <= 0) continue;
      
      // Find the photo's category
      const category = gallery.categories.find(c => c.categoryId === photo.categoryId) || {
        categoryId: 'uncategorized',
        name: 'Uncategorized', 
        color: '#cccccc'
      };
      
      // Load photo blob
      const photoBlob = await this.storage.getPhoto(photo.photoId);
      if (!photoBlob) {
        console.warn(`Failed to load photo blob for photoId: ${photo.photoId}`);
        continue;
      }
      
      // Create one segment for each chance
      for (let i = 0; i < currentChance; i++) {
        individualSegments.push({
          photoId: photo.photoId,
          category,
          photo: photoBlob
        });
      }
    }
    
    if (individualSegments.length === 0) {
      return segments; // Empty wheel
    }
    
    // Randomize the order of all segments
    const shuffledSegments = [...individualSegments].sort(() => Math.random() - 0.5);
    
    // Calculate equal angles for each segment
    const segmentAngle = (2 * Math.PI) / shuffledSegments.length;
    let currentAngle = 0;
    
    // Create wheel segments with equal sizes
    for (const segmentData of shuffledSegments) {
      segments.push({
        photoId: segmentData.photoId,
        photo: segmentData.photo,
        category: segmentData.category,
        chance: 1, // Each segment represents 1 chance
        startAngle: currentAngle,
        endAngle: currentAngle + segmentAngle,
        normalizedChance: 1 / shuffledSegments.length
      });
      
      currentAngle += segmentAngle;
    }
    
    return segments;
  }

  /**
   * Calculates the winning segment based on a target angle
   * Used after wheel animation completes
   */
  getWinningSegment(segments: WheelSegment[], targetAngle: number): WheelSegment | null {
    // Normalize angle to [0, 2π]
    const normalizedAngle = ((targetAngle % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
    
    for (const segment of segments) {
      if (normalizedAngle >= segment.startAngle && normalizedAngle < segment.endAngle) {
        return segment;
      }
    }
    
    return null;
  }

  /**
   * Validates if a gallery is ready for gameplay
   */
  validateGalleryForPlay(gallery: Gallery): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!gallery.photos || gallery.photos.length === 0) {
      errors.push('Gallery must have at least one photo');
    }
    
    // Categories are optional - photos can be uncategorized
    // if (!gallery.categories || gallery.categories.length === 0) {
    //   errors.push('Gallery must have at least one category');
    // }
    
    // Check if any photos have positive chances
    const hasPositiveChances = gallery.photos.some(photo => photo.chance > 0);
    if (!hasPositiveChances) {
      errors.push('At least one photo must have a chance greater than 0');
    }
    
    // Allow photos without categories - they'll use default category
    // const categoryIds = new Set(gallery.categories.map(c => c.categoryId));
    // const photosWithInvalidCategories = gallery.photos.filter(
    //   photo => photo.categoryId && !categoryIds.has(photo.categoryId)
    // );
    // 
    // if (photosWithInvalidCategories.length > 0) {
    //   errors.push(`${photosWithInvalidCategories.length} photos have invalid category assignments`);
    // }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Gets current session statistics
   */
  getSessionStatistics(session: PlaySession, gallery: Gallery): {
    totalPhotos: number;
    eligiblePhotos: number;
    totalCurrentChances: number;
    totalOriginalChances: number;
    consumedChances: number;
  } {
    const eligiblePhotos = gallery.photos.filter(photo => {
      const currentChance = session.currentChances.get(photo.photoId) || 0;
      return currentChance > 0;
    }).length;
    
    const totalCurrentChances = Array.from(session.currentChances.values())
      .reduce((sum, chance) => sum + chance, 0);
    
    const totalOriginalChances = Array.from(session.originalChances.values())
      .reduce((sum, chance) => sum + chance, 0);
    
    return {
      totalPhotos: gallery.photos.length,
      eligiblePhotos,
      totalCurrentChances,
      totalOriginalChances,
      consumedChances: totalOriginalChances - totalCurrentChances
    };
  }
}