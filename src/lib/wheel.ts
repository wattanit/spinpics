import { Gallery, Photo, PlaySession, WheelSegment, Category } from '../types/index.js';
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
  async createPlaySession(gallery: Gallery): Promise<PlaySession> {
    const currentChances = new Map<string, number>();
    const originalChances = new Map<string, number>();
    
    // Initialize chance maps from gallery photos
    gallery.photos.forEach(photo => {
      currentChances.set(photo.photoId, photo.chance);
      originalChances.set(photo.photoId, photo.chance);
    });
    
    // Generate the wheel segments once for the entire session
    const wheelSegments = await this.generateInitialWheelSegments(gallery, originalChances);
    
    return {
      galleryId: gallery.galleryId,
      spinMode: gallery.spinMode,
      currentChances,
      originalChances,
      wheelSegments,
      consumedSegments: new Set<string>()
    };
  }

  /**
   * Resets a play session to original chance values and restores full wheel
   */
  async resetPlaySession(session: PlaySession, gallery: Gallery): Promise<PlaySession> {
    const newCurrentChances = new Map<string, number>();
    
    // Reset current chances to original values
    session.originalChances.forEach((originalChance, photoId) => {
      newCurrentChances.set(photoId, originalChance);
    });
    
    // Regenerate full wheel segments with original chances
    const wheelSegments = await this.generateInitialWheelSegments(gallery, session.originalChances);
    
    return {
      ...session,
      currentChances: newCurrentChances,
      wheelSegments,
      consumedSegments: new Set<string>() // Clear consumed segments on reset
    };
  }

  /**
   * Generates initial wheel segments once per session (with randomized order)
   */
  private async generateInitialWheelSegments(gallery: Gallery, chances: Map<string, number>): Promise<WheelSegment[]> {
    const segments: WheelSegment[] = [];
    
    // Create individual segments for each chance instance
    const individualSegments: Array<{photoId: string, category: Category, photo: Blob}> = [];
    
    // Generate individual segments for each photo's chances
    for (const photo of gallery.photos) {
      const photoChances = chances.get(photo.photoId) || 0;
      if (photoChances <= 0) continue;
      
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
      for (let i = 0; i < photoChances; i++) {
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
    
    // Randomize the order of all segments ONCE
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
   * Gets current wheel segments for rendering
   * In consume mode, removes only specifically consumed segments (maintains order)
   */
  getCurrentWheelSegments(session: PlaySession): WheelSegment[] {
    if (session.spinMode === 'static') {
      // In static mode, all segments are always available
      return session.wheelSegments;
    }
    
    // In consume mode, filter out only the specifically consumed segments
    // This maintains visual consistency and segment order
    return session.wheelSegments.filter(segment => {
      const segmentId = `${segment.photoId}_${segment.startAngle}`;
      return !session.consumedSegments.has(segmentId);
    });
  }

  /**
   * Marks a specific segment as consumed for removal on next spin
   * This maintains visual consistency in consume mode
   */
  markSegmentAsConsumed(session: PlaySession, winningSegmentId: string): PlaySession {
    const updatedConsumedSegments = new Set(session.consumedSegments);
    updatedConsumedSegments.add(winningSegmentId);
    
    return {
      ...session,
      consumedSegments: updatedConsumedSegments
    };
  }

  /**
   * Removes consumed segments and regenerates wheel angles for remaining segments
   * Called at the start of a new spin to clean up consumed segments
   */
  updateWheelForNextSpin(session: PlaySession): PlaySession {
    if (session.spinMode === 'static') {
      return session; // No changes needed in static mode
    }
    
    // Remove consumed segments
    const remainingSegments = session.wheelSegments.filter(segment => {
      const segmentId = `${segment.photoId}_${segment.startAngle}`;
      return !session.consumedSegments.has(segmentId);
    });
    
    // Regenerate angles for remaining segments (maintain order)
    const updatedSegments: WheelSegment[] = [];
    if (remainingSegments.length > 0) {
      const segmentAngle = (2 * Math.PI) / remainingSegments.length;
      let currentAngle = 0;
      
      for (const segment of remainingSegments) {
        updatedSegments.push({
          ...segment,
          startAngle: currentAngle,
          endAngle: currentAngle + segmentAngle,
          normalizedChance: 1 / remainingSegments.length
        });
        
        currentAngle += segmentAngle;
      }
    }
    
    return {
      ...session,
      wheelSegments: updatedSegments,
      consumedSegments: new Set<string>() // Clear consumed segments after removal
    };
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