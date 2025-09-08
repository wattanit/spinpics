import type { Gallery, StorageManager } from '../types';

const GALLERIES_KEY = 'photo-wheel-galleries';
const DB_NAME = 'PhotoWheelDB';
const DB_VERSION = 1;
const PHOTOS_STORE = 'photos';

export class Storage implements StorageManager {
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    await this.initializeIndexedDB();
  }

  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(PHOTOS_STORE)) {
          db.createObjectStore(PHOTOS_STORE, { keyPath: 'photoId' });
        }
      };
    });
  }

  // Gallery operations using LocalStorage
  async getAllGalleries(): Promise<Gallery[]> {
    try {
      const stored = localStorage.getItem(GALLERIES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load galleries:', error);
      return [];
    }
  }

  async getGallery(galleryId: string): Promise<Gallery | null> {
    const galleries = await this.getAllGalleries();
    return galleries.find(g => g.galleryId === galleryId) || null;
  }

  async saveGallery(gallery: Gallery): Promise<void> {
    try {
      const galleries = await this.getAllGalleries();
      const existingIndex = galleries.findIndex(g => g.galleryId === gallery.galleryId);
      
      if (existingIndex >= 0) {
        galleries[existingIndex] = gallery;
      } else {
        galleries.push(gallery);
      }
      
      localStorage.setItem(GALLERIES_KEY, JSON.stringify(galleries));
    } catch (error) {
      console.error('Failed to save gallery:', error);
      throw new Error('Failed to save gallery');
    }
  }

  async deleteGallery(galleryId: string): Promise<void> {
    try {
      const galleries = await this.getAllGalleries();
      const gallery = galleries.find(g => g.galleryId === galleryId);
      
      if (gallery) {
        // Delete all photos for this gallery from IndexedDB
        for (const photo of gallery.photos) {
          await this.deletePhoto(photo.photoId);
        }
      }
      
      const filteredGalleries = galleries.filter(g => g.galleryId !== galleryId);
      localStorage.setItem(GALLERIES_KEY, JSON.stringify(filteredGalleries));
    } catch (error) {
      console.error('Failed to delete gallery:', error);
      throw new Error('Failed to delete gallery');
    }
  }

  // Photo blob operations using IndexedDB
  async savePhoto(photoId: string, blob: Blob): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PHOTOS_STORE], 'readwrite');
      const store = transaction.objectStore(PHOTOS_STORE);
      
      const request = store.put({ photoId, blob });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save photo'));
    });
  }

  async getPhoto(photoId: string): Promise<Blob | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PHOTOS_STORE], 'readonly');
      const store = transaction.objectStore(PHOTOS_STORE);
      
      const request = store.get(photoId);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.blob : null);
      };
      
      request.onerror = () => reject(new Error('Failed to get photo'));
    });
  }

  async deletePhoto(photoId: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PHOTOS_STORE], 'readwrite');
      const store = transaction.objectStore(PHOTOS_STORE);
      
      const request = store.delete(photoId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete photo'));
    });
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    localStorage.removeItem(GALLERIES_KEY);
    
    if (this.db) {
      const transaction = this.db.transaction([PHOTOS_STORE], 'readwrite');
      const store = transaction.objectStore(PHOTOS_STORE);
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to clear photos'));
      });
    }
  }

  async getStorageStats(): Promise<{ galleries: number; photos: number; storageUsed: number }> {
    const galleries = await this.getAllGalleries();
    const totalPhotos = galleries.reduce((sum, g) => sum + g.photos.length, 0);
    
    // Estimate storage usage
    const galleriesSize = JSON.stringify(galleries).length;
    let photosSize = 0;
    
    if (this.db) {
      // This is an approximation - IndexedDB doesn't provide easy size calculation
      photosSize = totalPhotos * 500000; // Estimate 500KB per photo
    }
    
    return {
      galleries: galleries.length,
      photos: totalPhotos,
      storageUsed: galleriesSize + photosSize
    };
  }
}

// Singleton instance
export const storage = new Storage();