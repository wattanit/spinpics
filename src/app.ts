import type { AppState, Gallery, Photo, Category } from './types';
import { storage } from './lib/storage';
import { WheelEngine } from './lib/wheel';
import { WheelRenderer } from './lib/animation';

export class App {
  private state: AppState = {
    currentScreen: 'home',
    currentGallery: null,
    playSession: null,
    galleries: []
  };
  
  // Track category being edited
  private editingCategoryId: string | null = null;
  private wheelEngine!: WheelEngine;
  private wheelRenderer!: WheelRenderer;

  async initialize(): Promise<void> {
    console.log('🎯 Initializing Photo Wheel Spinner...');
    
    try {
      // Initialize storage layer
      await storage.initialize();
      console.log('✅ Storage initialized');
      
      // Initialize wheel engine
      this.wheelEngine = new WheelEngine(storage);
      console.log('✅ Wheel engine initialized');
      
      // Initialize wheel renderer
      const canvas = document.getElementById('wheel-canvas') as HTMLCanvasElement;
      if (canvas) {
        this.wheelRenderer = new WheelRenderer(canvas);
        console.log('✅ Wheel renderer initialized');
      }
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Handle window resize for canvas
      window.addEventListener('resize', () => {
        if (this.wheelRenderer) {
          this.wheelRenderer.resize();
        }
      });
      
      // Load initial data
      await this.loadGalleries();
      
      // Set initial screen
      this.showScreen('home');
      
      console.log('✅ App initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize app:', error);
      this.showError('Failed to initialize application. Please refresh the page.');
    }
  }

  private setupEventListeners(): void {
    // Navigation
    document.getElementById('home-btn')?.addEventListener('click', () => {
      this.showScreen('home');
    });

    document.getElementById('back-to-home')?.addEventListener('click', () => {
      this.showScreen('home');
    });

    document.getElementById('play-gallery')?.addEventListener('click', () => {
      if (this.state.currentGallery) {
        this.playGallery(this.state.currentGallery.galleryId);
      }
    });

    document.getElementById('create-btn')?.addEventListener('click', () => {
      this.showModal('new-gallery-modal');
    });

    // Modal controls
    document.getElementById('new-gallery-btn')?.addEventListener('click', () => {
      this.showModal('new-gallery-modal');
    });

    document.getElementById('create-new-gallery')?.addEventListener('click', () => {
      this.createGallery();
    });

    document.getElementById('cancel-new-gallery')?.addEventListener('click', () => {
      this.hideModal('new-gallery-modal');
    });

    // Category modal controls
    document.getElementById('new-category-btn')?.addEventListener('click', () => {
      this.showModal('new-category-modal');
    });

    document.getElementById('create-new-category')?.addEventListener('click', () => {
      this.createCategory();
    });

    document.getElementById('cancel-new-category')?.addEventListener('click', () => {
      this.hideModal('new-category-modal');
    });

    // Edit category modal controls
    document.getElementById('save-edit-category')?.addEventListener('click', () => {
      this.saveEditCategory();
    });

    document.getElementById('cancel-edit-category')?.addEventListener('click', () => {
      this.hideModal('edit-category-modal');
    });

    // Gallery tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab((e.target as HTMLElement).dataset.tab || '');
      });
    });

    // Photo upload
    document.getElementById('upload-btn')?.addEventListener('click', () => {
      document.getElementById('photo-upload')?.click();
    });

    document.getElementById('photo-upload')?.addEventListener('change', (e) => {
      const input = e.target as HTMLInputElement;
      if (input.files) {
        this.handlePhotoUpload(Array.from(input.files));
      }
    });

    // Gallery settings
    document.getElementById('save-settings')?.addEventListener('click', () => {
      this.saveGallerySettings();
    });

    document.getElementById('delete-gallery')?.addEventListener('click', () => {
      this.deleteCurrentGallery();
    });

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = (e.target as HTMLElement).closest('.modal');
        if (modal) {
          this.hideModal(modal.id);
        }
      });
    });

    // Modal overlay clicks
    document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.hideAllModals();
      }
    });

    // Play screen controls
    document.getElementById('spin-btn')?.addEventListener('click', () => {
      this.spin();
    });

    document.getElementById('reset-session-btn')?.addEventListener('click', () => {
      this.resetSession();
    });

    document.getElementById('back-to-gallery-btn')?.addEventListener('click', () => {
      if (this.state.currentGallery) {
        this.editGallery(this.state.currentGallery.galleryId);
      }
    });
  }

  private async loadGalleries(): Promise<void> {
    try {
      this.state.galleries = await storage.getAllGalleries();
      this.renderGalleries();
    } catch (error) {
      console.error('Failed to load galleries:', error);
      this.showError('Failed to load galleries');
    }
  }

  private renderGalleries(): void {
    const container = document.getElementById('galleries-container');
    if (!container) return;

    if (this.state.galleries.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No galleries yet. Create your first spinning wheel!</p>
          <button class="btn btn-secondary" id="get-started-btn">Get Started</button>
        </div>
      `;
      
      document.getElementById('get-started-btn')?.addEventListener('click', () => {
        this.showModal('new-gallery-modal');
      });
    } else {
      container.innerHTML = this.state.galleries.map(gallery => `
        <div class="gallery-card" data-gallery-id="${gallery.galleryId}">
          <div class="gallery-cover">
            <img class="gallery-cover-image" data-gallery-id="${gallery.galleryId}" alt="${gallery.name} cover">
          </div>
          <div class="gallery-info">
            <h3>${gallery.name}</h3>
            <p>${gallery.photos.length} photos • ${gallery.categories.length} categories</p>
            <p>Mode: ${gallery.spinMode}</p>
            <div class="gallery-actions">
              <button class="btn btn-outline" onclick="app.editGallery('${gallery.galleryId}')">Edit</button>
              <button class="btn btn-primary" onclick="app.playGallery('${gallery.galleryId}')">Play</button>
            </div>
          </div>
        </div>
      `).join('');
      
      // Load cover photos for each gallery
      this.loadGalleryCoverPhotos();
    }
  }

  private async loadGalleryCoverPhotos(): Promise<void> {
    for (const gallery of this.state.galleries) {
      const coverImg = document.querySelector(`img.gallery-cover-image[data-gallery-id="${gallery.galleryId}"]`) as HTMLImageElement;
      if (!coverImg) continue;

      // Get cover photo (use coverPhotoId if set, otherwise first photo)
      const coverPhotoId = gallery.coverPhotoId || (gallery.photos.length > 0 ? gallery.photos[0].photoId : null);
      
      if (coverPhotoId) {
        try {
          const photoBlob = await storage.getPhoto(coverPhotoId);
          if (photoBlob) {
            const photoUrl = URL.createObjectURL(photoBlob);
            coverImg.src = photoUrl;
            coverImg.style.display = 'block';
            // Clean up URL when image loads
            coverImg.onload = () => URL.revokeObjectURL(photoUrl);
          }
        } catch (error) {
          console.error('Error loading cover photo:', error);
        }
      } else {
        // No photos in gallery - show placeholder
        coverImg.style.display = 'none';
      }
    }
  }

  private async createGallery(): Promise<void> {
    const nameInput = document.getElementById('new-gallery-name') as HTMLInputElement;
    const name = nameInput?.value?.trim();

    if (!name) {
      this.showError('Please enter a gallery name');
      return;
    }

    // Check for duplicate names
    const existingGallery = this.state.galleries.find(g => g.name.toLowerCase() === name.toLowerCase());
    if (existingGallery) {
      this.showError('A gallery with this name already exists');
      return;
    }

    try {
      const gallery: Gallery = {
        galleryId: this.generateId(),
        name,
        spinMode: 'static',
        categories: [],
        photos: []
      };

      await storage.saveGallery(gallery);
      this.state.galleries.push(gallery);
      this.renderGalleries();
      this.hideModal('new-gallery-modal');
      nameInput.value = '';

      console.log('Gallery created:', gallery);

      // Navigate to the newly created gallery's management page
      await this.editGallery(gallery.galleryId);
    } catch (error) {
      console.error('Failed to create gallery:', error);
      this.showError('Failed to create gallery');
    }
  }

  private showScreen(screenName: AppState['currentScreen']): void {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });

    // Show target screen
    document.getElementById(`${screenName}-screen`)?.classList.add('active');

    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    if (screenName === 'home') {
      document.getElementById('home-btn')?.classList.add('active');
    }

    this.state.currentScreen = screenName;
  }

  private showModal(modalId: string): void {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById(modalId);
    
    if (overlay && modal) {
      // Hide all modals first
      document.querySelectorAll('.modal').forEach(m => {
        (m as HTMLElement).style.display = 'none';
      });
      
      // Show target modal
      modal.style.display = 'block';
      overlay.classList.add('active');
    }
  }

  private hideModal(modalId: string): void {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById(modalId);
    
    if (overlay && modal) {
      modal.style.display = 'none';
      overlay.classList.remove('active');
    }
  }

  private hideAllModals(): void {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
    
    document.querySelectorAll('.modal').forEach(modal => {
      (modal as HTMLElement).style.display = 'none';
    });
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private showError(message: string): void {
    // Simple error display - could be enhanced with a toast system later
    alert(message);
  }

  // Gallery Management Methods
  async editGallery(galleryId: string): Promise<void> {
    const gallery = this.state.galleries.find(g => g.galleryId === galleryId);
    if (!gallery) {
      this.showError('Gallery not found');
      return;
    }

    this.state.currentGallery = gallery;
    this.showScreen('gallery');
    this.populateGalleryEditor(gallery);
  }

  async playGallery(galleryId: string): Promise<void> {
    const gallery = this.state.galleries.find(g => g.galleryId === galleryId);
    if (!gallery) {
      this.showError('Gallery not found');
      return;
    }

    // Validate gallery for play
    const validation = this.wheelEngine.validateGalleryForPlay(gallery);
    if (!validation.isValid) {
      this.showError(`Cannot play this gallery:\n${validation.errors.join('\n')}`);
      return;
    }

    this.state.currentGallery = gallery;
    this.state.playSession = await this.wheelEngine.createPlaySession(gallery);
    this.showScreen('play');
    
    await this.initializePlayScreen();
  }

  private populateGalleryEditor(gallery: Gallery): void {
    // Populate gallery name in settings
    const nameInput = document.getElementById('gallery-name-input') as HTMLInputElement;
    if (nameInput) nameInput.value = gallery.name;

    // Populate spin mode
    const spinModeSelect = document.getElementById('spin-mode-select') as HTMLSelectElement;
    if (spinModeSelect) spinModeSelect.value = gallery.spinMode;

    // Populate double spin toggle
    const doubleSpinToggle = document.getElementById('double-spin-toggle') as HTMLInputElement;
    if (doubleSpinToggle) doubleSpinToggle.checked = gallery.doubleSpinEnabled || false;

    // Populate cover photo selection
    this.populateCoverPhotoSelection(gallery);

    // Render photos, categories, and set default tab
    this.renderPhotos();
    this.renderCategories();
    this.switchTab('photos');
  }

  private async populateCoverPhotoSelection(gallery: Gallery): Promise<void> {
    const coverPhotoSelect = document.getElementById('cover-photo-select') as HTMLSelectElement;
    
    if (!coverPhotoSelect) return;

    // Clear existing options
    coverPhotoSelect.innerHTML = '<option value="">No cover photo</option>';

    // Add photo options
    for (const photo of gallery.photos) {
      const option = document.createElement('option');
      option.value = photo.photoId;
      option.textContent = `Photo ${gallery.photos.indexOf(photo) + 1}`;
      coverPhotoSelect.appendChild(option);
    }

    // Set current value
    coverPhotoSelect.value = gallery.coverPhotoId || '';

    // Update preview
    await this.updateCoverPhotoPreview(gallery.coverPhotoId);

    // Add change event listener
    coverPhotoSelect.onchange = async () => {
      await this.updateCoverPhotoPreview(coverPhotoSelect.value || undefined);
    };
  }

  private async updateCoverPhotoPreview(photoId?: string): Promise<void> {
    const coverPhotoPreview = document.getElementById('cover-photo-preview') as HTMLDivElement;
    const coverPhotoImage = document.getElementById('cover-photo-image') as HTMLImageElement;
    
    if (!coverPhotoPreview || !coverPhotoImage) return;

    if (photoId) {
      try {
        const photoBlob = await storage.getPhoto(photoId);
        if (photoBlob) {
          const photoUrl = URL.createObjectURL(photoBlob);
          coverPhotoImage.src = photoUrl;
          coverPhotoPreview.style.display = 'block';
          // Clean up URL when image loads
          coverPhotoImage.onload = () => URL.revokeObjectURL(photoUrl);
        }
      } catch (error) {
        console.error('Error loading cover photo preview:', error);
        coverPhotoPreview.style.display = 'none';
      }
    } else {
      coverPhotoPreview.style.display = 'none';
    }
  }

  private switchTab(tabName: string): void {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`)?.classList.add('active');
  }

  private renderPhotos(): void {
    const container = document.getElementById('photos-grid');
    if (!container || !this.state.currentGallery) return;

    if (this.state.currentGallery.photos.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No photos in this gallery yet.</p>
        </div>
      `;
    } else {
      // We'll render photos from IndexedDB
      this.renderPhotosFromStorage();
    }
  }

  private async renderPhotosFromStorage(): Promise<void> {
    const container = document.getElementById('photos-grid');
    if (!container || !this.state.currentGallery) return;

    try {
      const photosHtml = await Promise.all(
        this.state.currentGallery.photos.map(async photo => {
          const blob = await storage.getPhoto(photo.photoId);
          if (!blob) return '';

          const imageUrl = URL.createObjectURL(blob);
          const category = this.state.currentGallery!.categories.find(c => c.categoryId === photo.categoryId);
          
          return `
            <div class="photo-item" data-photo-id="${photo.photoId}">
              <div class="photo-preview" style="background-color: ${category?.color || '#ccc'};">
                <img src="${imageUrl}" alt="Photo" loading="lazy">
              </div>
              <div class="photo-controls">
                <div class="photo-info">
                  <label>Chance:</label>
                  <input type="number" class="chance-input" value="${photo.chance}" min="0" 
                         onchange="app.updatePhotoChance('${photo.photoId}', this.value)">
                </div>
                <div class="photo-info">
                  <label>Category:</label>
                  <select class="category-select" onchange="app.updatePhotoCategory('${photo.photoId}', this.value)">
                    <option value="">Uncategorized</option>
                    ${this.state.currentGallery!.categories.map(cat => `
                      <option value="${cat.categoryId}" ${photo.categoryId === cat.categoryId ? 'selected' : ''}>
                        ${cat.name}
                      </option>
                    `).join('')}
                  </select>
                </div>
                <button class="btn btn-danger btn-sm" onclick="app.deletePhoto('${photo.photoId}')">Delete</button>
              </div>
            </div>
          `;
        })
      );

      container.innerHTML = photosHtml.join('');
    } catch (error) {
      console.error('Failed to render photos:', error);
      container.innerHTML = '<div class="error">Failed to load photos</div>';
    }
  }

  private async handlePhotoUpload(files: File[]): Promise<void> {
    if (!this.state.currentGallery) {
      this.showError('No gallery selected');
      return;
    }

    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          console.warn('Skipping non-image file:', file.name);
          continue;
        }

        const photoId = this.generateId();
        await storage.savePhoto(photoId, file);

        const newPhoto = {
          photoId,
          chance: 1,
          categoryId: ''
        };

        this.state.currentGallery.photos.push(newPhoto);
      }

      await storage.saveGallery(this.state.currentGallery);
      
      // Update the gallery in the state
      const galleryIndex = this.state.galleries.findIndex(g => g.galleryId === this.state.currentGallery!.galleryId);
      if (galleryIndex >= 0) {
        this.state.galleries[galleryIndex] = this.state.currentGallery;
      }

      this.renderPhotos();
      
      // Refresh cover photo selection to include new photos
      if (this.state.currentGallery) {
        await this.populateCoverPhotoSelection(this.state.currentGallery);
      }
    } catch (error) {
      console.error('Failed to upload photos:', error);
      this.showError('Failed to upload photos');
    }
  }

  async updatePhotoChance(photoId: string, chance: string): Promise<void> {
    if (!this.state.currentGallery) return;

    const photo = this.state.currentGallery.photos.find(p => p.photoId === photoId);
    if (!photo) return;

    const numChance = Math.max(0, parseInt(chance) || 0);
    photo.chance = numChance;

    try {
      await storage.saveGallery(this.state.currentGallery);
      
      // Update in galleries array
      const galleryIndex = this.state.galleries.findIndex(g => g.galleryId === this.state.currentGallery!.galleryId);
      if (galleryIndex >= 0) {
        this.state.galleries[galleryIndex] = this.state.currentGallery;
      }
    } catch (error) {
      console.error('Failed to update photo chance:', error);
      this.showError('Failed to update photo chance');
    }
  }

  async updatePhotoCategory(photoId: string, categoryId: string): Promise<void> {
    if (!this.state.currentGallery) return;

    const photo = this.state.currentGallery.photos.find(p => p.photoId === photoId);
    if (!photo) return;

    photo.categoryId = categoryId;

    try {
      await storage.saveGallery(this.state.currentGallery);
      
      // Update in galleries array  
      const galleryIndex = this.state.galleries.findIndex(g => g.galleryId === this.state.currentGallery!.galleryId);
      if (galleryIndex >= 0) {
        this.state.galleries[galleryIndex] = this.state.currentGallery;
      }

      // Re-render to update visual category color
      this.renderPhotos();
    } catch (error) {
      console.error('Failed to update photo category:', error);
      this.showError('Failed to update photo category');
    }
  }

  async deletePhoto(photoId: string): Promise<void> {
    if (!this.state.currentGallery) return;

    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      await storage.deletePhoto(photoId);
      
      this.state.currentGallery.photos = this.state.currentGallery.photos.filter(p => p.photoId !== photoId);
      
      // If deleted photo was the cover photo, clear it
      if (this.state.currentGallery.coverPhotoId === photoId) {
        this.state.currentGallery.coverPhotoId = undefined;
      }
      
      await storage.saveGallery(this.state.currentGallery);
      
      // Update in galleries array
      const galleryIndex = this.state.galleries.findIndex(g => g.galleryId === this.state.currentGallery!.galleryId);
      if (galleryIndex >= 0) {
        this.state.galleries[galleryIndex] = this.state.currentGallery;
      }

      this.renderPhotos();
      
      // Refresh cover photo selection to reflect deleted photo
      if (this.state.currentGallery) {
        await this.populateCoverPhotoSelection(this.state.currentGallery);
      }
    } catch (error) {
      console.error('Failed to delete photo:', error);
      this.showError('Failed to delete photo');
    }
  }

  private renderCategories(): void {
    const container = document.getElementById('categories-list');
    if (!container || !this.state.currentGallery) return;

    if (this.state.currentGallery.categories.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No categories created yet.</p>
        </div>
      `;
    } else {
      container.innerHTML = this.state.currentGallery.categories.map(category => `
        <div class="category-item" data-category-id="${category.categoryId}">
          <div class="category-color" style="background-color: ${category.color};"></div>
          <div class="category-info">
            <h4>${category.name}</h4>
            <p>Color: ${category.color}</p>
          </div>
          <div class="category-actions">
            <button class="btn btn-outline btn-sm" onclick="app.editCategory('${category.categoryId}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="app.deleteCategory('${category.categoryId}')">Delete</button>
          </div>
        </div>
      `).join('');
    }
  }

  private async createCategory(): Promise<void> {
    const nameInput = document.getElementById('new-category-name') as HTMLInputElement;
    const colorInput = document.getElementById('new-category-color') as HTMLInputElement;
    
    const name = nameInput?.value?.trim();
    const color = colorInput?.value;

    if (!name) {
      this.showError('Please enter a category name');
      return;
    }

    if (!this.state.currentGallery) {
      this.showError('No gallery selected');
      return;
    }

    // Check for duplicate names
    const existingCategory = this.state.currentGallery.categories.find(c => 
      c.name.toLowerCase() === name.toLowerCase()
    );
    if (existingCategory) {
      this.showError('A category with this name already exists');
      return;
    }

    try {
      const newCategory = {
        categoryId: this.generateId(),
        name,
        color: color || '#2196F3'
      };

      this.state.currentGallery.categories.push(newCategory);
      await storage.saveGallery(this.state.currentGallery);
      
      // Update in galleries array
      const galleryIndex = this.state.galleries.findIndex(g => g.galleryId === this.state.currentGallery!.galleryId);
      if (galleryIndex >= 0) {
        this.state.galleries[galleryIndex] = this.state.currentGallery;
      }

      this.renderCategories();
      this.renderPhotos(); // Re-render photos to update category options
      this.hideModal('new-category-modal');
      
      // Clear form
      nameInput.value = '';
      colorInput.value = '#2196F3';

    } catch (error) {
      console.error('Failed to create category:', error);
      this.showError('Failed to create category');
    }
  }

  async editCategory(categoryId: string): Promise<void> {
    if (!this.state.currentGallery) return;

    const category = this.state.currentGallery.categories.find(c => c.categoryId === categoryId);
    if (!category) {
      this.showError('Category not found');
      return;
    }

    // Store the category being edited
    this.editingCategoryId = categoryId;

    // Pre-populate the edit modal with current values
    const nameInput = document.getElementById('edit-category-name') as HTMLInputElement;
    const colorInput = document.getElementById('edit-category-color') as HTMLInputElement;

    if (nameInput) nameInput.value = category.name;
    if (colorInput) colorInput.value = category.color;

    // Show the edit modal
    this.showModal('edit-category-modal');
  }

  private async saveEditCategory(): Promise<void> {
    if (!this.state.currentGallery || !this.editingCategoryId) {
      this.showError('No category selected for editing');
      return;
    }

    const nameInput = document.getElementById('edit-category-name') as HTMLInputElement;
    const colorInput = document.getElementById('edit-category-color') as HTMLInputElement;
    
    const name = nameInput?.value?.trim();
    const color = colorInput?.value;

    if (!name) {
      this.showError('Please enter a category name');
      return;
    }

    // Check for duplicate names (excluding the current category)
    const existingCategory = this.state.currentGallery.categories.find(c => 
      c.name.toLowerCase() === name.toLowerCase() && c.categoryId !== this.editingCategoryId
    );
    if (existingCategory) {
      this.showError('A category with this name already exists');
      return;
    }

    try {
      // Find and update the category
      const categoryIndex = this.state.currentGallery.categories.findIndex(
        c => c.categoryId === this.editingCategoryId
      );
      
      if (categoryIndex === -1) {
        this.showError('Category not found');
        return;
      }

      // Update the category
      this.state.currentGallery.categories[categoryIndex] = {
        ...this.state.currentGallery.categories[categoryIndex],
        name,
        color: color || '#2196F3'
      };

      await storage.saveGallery(this.state.currentGallery);
      
      // Update in galleries array
      const galleryIndex = this.state.galleries.findIndex(g => g.galleryId === this.state.currentGallery!.galleryId);
      if (galleryIndex >= 0) {
        this.state.galleries[galleryIndex] = this.state.currentGallery;
      }

      this.renderCategories();
      this.renderPhotos(); // Re-render photos to update category colors
      this.hideModal('edit-category-modal');
      
      // Clear editing state
      this.editingCategoryId = null;

    } catch (error) {
      console.error('Failed to update category:', error);
      this.showError('Failed to update category');
    }
  }

  async deleteCategory(categoryId: string): Promise<void> {
    if (!this.state.currentGallery) return;

    if (!confirm('Are you sure you want to delete this category? Photos will become uncategorized.')) return;

    try {
      // Remove category
      this.state.currentGallery.categories = this.state.currentGallery.categories.filter(c => c.categoryId !== categoryId);
      
      // Update photos that were in this category
      this.state.currentGallery.photos.forEach(photo => {
        if (photo.categoryId === categoryId) {
          photo.categoryId = '';
        }
      });

      await storage.saveGallery(this.state.currentGallery);
      
      // Update in galleries array
      const galleryIndex = this.state.galleries.findIndex(g => g.galleryId === this.state.currentGallery!.galleryId);
      if (galleryIndex >= 0) {
        this.state.galleries[galleryIndex] = this.state.currentGallery;
      }

      this.renderCategories();
      this.renderPhotos(); // Re-render photos to update category options
    } catch (error) {
      console.error('Failed to delete category:', error);
      this.showError('Failed to delete category');
    }
  }

  private async saveGallerySettings(): Promise<void> {
    if (!this.state.currentGallery) {
      this.showError('No gallery selected');
      return;
    }

    const nameInput = document.getElementById('gallery-name-input') as HTMLInputElement;
    const spinModeSelect = document.getElementById('spin-mode-select') as HTMLSelectElement;
    const coverPhotoSelect = document.getElementById('cover-photo-select') as HTMLSelectElement;
    const doubleSpinToggle = document.getElementById('double-spin-toggle') as HTMLInputElement;
    
    const name = nameInput?.value?.trim();
    const spinMode = spinModeSelect?.value as 'static' | 'consume';
    const coverPhotoId = coverPhotoSelect?.value || undefined;
    const doubleSpinEnabled = doubleSpinToggle?.checked || false;

    if (!name) {
      this.showError('Please enter a gallery name');
      return;
    }

    // Check for duplicate names (excluding current gallery)
    const existingGallery = this.state.galleries.find(g => 
      g.galleryId !== this.state.currentGallery!.galleryId && 
      g.name.toLowerCase() === name.toLowerCase()
    );
    if (existingGallery) {
      this.showError('A gallery with this name already exists');
      return;
    }

    try {
      this.state.currentGallery.name = name;
      this.state.currentGallery.spinMode = spinMode;
      this.state.currentGallery.coverPhotoId = coverPhotoId;
      this.state.currentGallery.doubleSpinEnabled = doubleSpinEnabled;

      await storage.saveGallery(this.state.currentGallery);
      
      // Update in galleries array
      const galleryIndex = this.state.galleries.findIndex(g => g.galleryId === this.state.currentGallery!.galleryId);
      if (galleryIndex >= 0) {
        this.state.galleries[galleryIndex] = this.state.currentGallery;
      }

      // Refresh gallery list to update cover photos
      this.renderGalleries();

      this.showError('Settings saved successfully!'); // Using showError for now as a notification
    } catch (error) {
      console.error('Failed to save gallery settings:', error);
      this.showError('Failed to save settings');
    }
  }

  private async deleteCurrentGallery(): Promise<void> {
    if (!this.state.currentGallery) return;

    if (!confirm(`Are you sure you want to delete "${this.state.currentGallery.name}"? This action cannot be undone.`)) return;

    try {
      // Delete all photos from IndexedDB
      for (const photo of this.state.currentGallery.photos) {
        await storage.deletePhoto(photo.photoId);
      }

      // Delete gallery from storage
      await storage.deleteGallery(this.state.currentGallery.galleryId);
      
      // Remove from state
      this.state.galleries = this.state.galleries.filter(g => g.galleryId !== this.state.currentGallery!.galleryId);
      this.state.currentGallery = null;

      // Navigate back to home
      this.showScreen('home');
      this.renderGalleries();
    } catch (error) {
      console.error('Failed to delete gallery:', error);
      this.showError('Failed to delete gallery');
    }
  }

  // Play Screen Methods
  private async initializePlayScreen(): Promise<void> {
    if (!this.state.currentGallery || !this.state.playSession) {
      this.showError('No gallery or session active');
      return;
    }

    try {
      // Update play screen header
      const galleryNameEl = document.getElementById('play-gallery-name');
      if (galleryNameEl) {
        galleryNameEl.textContent = this.state.currentGallery.name;
      }

      // Show/hide reset button based on spin mode
      const resetBtn = document.getElementById('reset-session-btn');
      if (resetBtn) {
        resetBtn.style.display = this.state.playSession.spinMode === 'consume' ? 'block' : 'none';
      }

      // Update session stats
      this.updateSessionStats();

      // Initialize wheel visualization
      await this.renderWheel();

      // Clear any previous results
      this.clearPlayResults();

    } catch (error) {
      console.error('Failed to initialize play screen:', error);
      this.showError('Failed to initialize play screen');
    }
  }

  private updateSessionStats(): void {
    if (!this.state.currentGallery || !this.state.playSession) return;

    const stats = this.wheelEngine.getSessionStatistics(this.state.playSession, this.state.currentGallery);
    
    const statsContainer = document.getElementById('session-stats');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="stat-item">
          <span class="stat-label">Total Photos:</span>
          <span class="stat-value">${stats.totalPhotos}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Eligible Photos:</span>
          <span class="stat-value">${stats.eligiblePhotos}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total Chances:</span>
          <span class="stat-value">${stats.totalCurrentChances}</span>
        </div>
        ${this.state.playSession.spinMode === 'consume' ? `
          <div class="stat-item">
            <span class="stat-label">Consumed:</span>
            <span class="stat-value">${stats.consumedChances}</span>
          </div>
        ` : ''}
      `;
    }
  }

  private async renderWheel(): Promise<void> {
    if (!this.state.currentGallery || !this.state.playSession || !this.wheelRenderer) {
      return;
    }

    try {
      // Get current wheel segments (fixed arrangement, filtered for consume mode)
      const segments = this.wheelEngine.getCurrentWheelSegments(this.state.playSession);

      // Update wheel renderer with segments
      await this.wheelRenderer.updateSegments(segments);
      
      console.log(`Wheel rendered with ${segments.length} segments`);
    } catch (error) {
      console.error('Failed to render wheel:', error);
      console.error('Current gallery:', this.state.currentGallery);
      console.error('Play session:', this.state.playSession);
      this.showError(`Failed to render wheel: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private clearPlayResults(): void {
    const resultContainer = document.getElementById('spin-result');
    if (resultContainer) {
      resultContainer.style.display = 'none';
      
      // Clear individual photo containers instead of removing entire HTML structure
      const photo1 = document.getElementById('winning-photo-1');
      const photo2 = document.getElementById('winning-photo-2');
      
      if (photo1) {
        photo1.innerHTML = '';
        photo1.style.display = 'none';
      }
      if (photo2) {
        photo2.innerHTML = '';
        photo2.style.display = 'none';
      }
      
      // Reset title
      const titleElement = document.getElementById('result-title');
      if (titleElement) titleElement.textContent = 'Winner!';
    }
    
    // Clear winner highlight
    if (this.wheelRenderer) {
      this.wheelRenderer.clearWinnerHighlight();
    }
  }

  private async spin(): Promise<void> {
    if (!this.state.currentGallery || !this.state.playSession) {
      this.showError('No active game session');
      return;
    }

    const isDoubleSpin = this.state.currentGallery.doubleSpinEnabled || false;

    if (isDoubleSpin) {
      await this.performDoubleSpin();
    } else {
      await this.performSingleSpin();
    }
  }

  private async performSingleSpin(): Promise<void> {
    try {
      // Disable spin button during animation
      const spinBtn = document.getElementById('spin-btn') as HTMLButtonElement;
      if (spinBtn) {
        spinBtn.disabled = true;
        spinBtn.textContent = 'Spinning...';
      }

      // Clear any previous winning animation
      this.wheelRenderer.clearWinnerHighlight();

      // Update wheel for next spin (remove consumed segments in consume mode)
      this.state.playSession = this.wheelEngine.updateWheelForNextSpin(this.state.playSession!);

      // Get current wheel segments after cleanup
      const segments = this.wheelEngine.getCurrentWheelSegments(this.state.playSession);
      
      // Re-render wheel with updated segments if any were removed
      await this.renderWheel();

      if (segments.length === 0) {
        this.showError('No eligible photos to spin! All chances may be consumed.');
        return;
      }

      // Generate random spin
      const baseRotations = (Math.random() * 3 + 2) * Math.PI * 2;
      const randomAngle = Math.random() * Math.PI * 2;
      const targetAngle = baseRotations + randomAngle;

      // Perform wheel spin animation
      await this.wheelRenderer.startSpin(targetAngle, 3000);

      // Determine winner
      const winningSegment = this.wheelRenderer.getSegmentUnderNeedle();
      if (!winningSegment) {
        this.showError('Error determining winning segment');
        return;
      }

      const winningPhoto = this.state.currentGallery!.photos.find(p => p.photoId === winningSegment.photoId);
      if (!winningPhoto) {
        this.showError('Error finding winning photo');
        return;
      }

      // Highlight winner
      this.wheelRenderer.highlightWinner(winningSegment.photoId);

      // Update session state
      this.state.playSession = this.wheelEngine.updateSessionAfterSpin(this.state.playSession, winningSegment.photoId);
      
      // Handle consume mode
      if (this.state.playSession.spinMode === 'consume') {
        const currentSegments = this.wheelEngine.getCurrentWheelSegments(this.state.playSession);
        if (currentSegments.length > 1) {
          const winningSegmentId = `${winningSegment.photoId}_${winningSegment.startAngle}`;
          this.state.playSession = this.wheelEngine.markSegmentAsConsumed(this.state.playSession, winningSegmentId);
        }
      }

      // Display result
      await this.displaySingleSpinResult(winningPhoto, winningSegment.category);
      this.updateSessionStats();

    } catch (error) {
      console.error('Error during single spin:', error);
      this.showError('Error during spin');
    } finally {
      // Re-enable spin button
      const spinBtn = document.getElementById('spin-btn') as HTMLButtonElement;
      if (spinBtn) {
        spinBtn.disabled = false;
        spinBtn.textContent = 'SPIN!';
      }
    }
  }

  private async performDoubleSpin(): Promise<void> {
    try {
      // Disable spin button during animation
      const spinBtn = document.getElementById('spin-btn') as HTMLButtonElement;
      if (spinBtn) {
        spinBtn.disabled = true;
        spinBtn.textContent = 'Double Spinning...';
      }

      // Clear any previous winning animation
      this.wheelRenderer.clearWinnerHighlight();

      // Update wheel for next spin
      this.state.playSession = this.wheelEngine.updateWheelForNextSpin(this.state.playSession!);

      // Get current wheel segments
      const segments = this.wheelEngine.getCurrentWheelSegments(this.state.playSession);
      await this.renderWheel();

      if (segments.length === 0) {
        this.showError('No eligible photos to spin! All chances may be consumed.');
        return;
      }

      // First spin - random animation
      const firstTarget = (Math.random() * 3 + 2) * Math.PI * 2 + Math.random() * Math.PI * 2;
      await this.wheelRenderer.startSpin(firstTarget, 3000);

      // Get first winner based on where wheel landed
      const firstWinningSegment = this.wheelRenderer.getSegmentUnderNeedle();
      if (!firstWinningSegment) {
        this.showError('Error determining first winner');
        return;
      }

      const firstWinningPhoto = this.state.currentGallery!.photos.find(p => p.photoId === firstWinningSegment.photoId);
      if (!firstWinningPhoto) {
        this.showError('Error finding first winning photo');
        return;
      }

      // Highlight first winner briefly
      this.wheelRenderer.highlightWinner(firstWinningSegment.photoId);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Show first result
      this.wheelRenderer.clearWinnerHighlight();

      // Prepare photos for second spin - try to select from different category
      const firstWinnerCategoryId = firstWinningPhoto.categoryId;
      const eligiblePhotos = this.state.currentGallery!.photos.filter(photo => {
        const currentChance = this.state.playSession?.currentChances.get(photo.photoId) || 0;
        return currentChance > 0;
      });

      // Group photos by category for category-aware selection
      const photosByCategory = new Map<string, Photo[]>();
      eligiblePhotos.forEach(photo => {
        if (!photosByCategory.has(photo.categoryId)) {
          photosByCategory.set(photo.categoryId, []);
        }
        photosByCategory.get(photo.categoryId)!.push(photo);
      });

      const availableCategories = Array.from(photosByCategory.keys());
      const otherCategories = availableCategories.filter(cat => cat !== firstWinnerCategoryId);

      // For second spin, prefer other categories but allow same category if needed
      let secondSpinPhotos: Photo[];
      if (otherCategories.length > 0) {
        // Select from different categories
        secondSpinPhotos = [];
        otherCategories.forEach(categoryId => {
          const categoryPhotos = photosByCategory.get(categoryId) || [];
          secondSpinPhotos.push(...categoryPhotos);
        });
      } else {
        // Only one category available, select from same category (excluding first winner)
        secondSpinPhotos = eligiblePhotos.filter(photo => photo.photoId !== firstWinningSegment.photoId);
      }

      if (secondSpinPhotos.length === 0) {
        // Only one photo available total, show single result
        const winningPhotos = [firstWinningPhoto];
        const winningPhotoIds = [firstWinningSegment.photoId];
        
        // Update session state
        this.state.playSession = this.wheelEngine.updateSessionAfterDoubleSpin(this.state.playSession, winningPhotoIds);
        
        // Display result
        await this.displayDoubleSpinResult(winningPhotos);
        this.updateSessionStats();
        return;
      }

      // Create a temporary play session with only second spin photos for authentic wheel behavior
      const tempSession = { ...this.state.playSession };
      const tempChances = new Map(this.state.playSession.currentChances);
      
      // Set chances to 0 for photos not in the second spin selection
      this.state.currentGallery!.photos.forEach(photo => {
        if (!secondSpinPhotos.find(sp => sp.photoId === photo.photoId)) {
          tempChances.set(photo.photoId, 0);
        }
      });
      
      tempSession.currentChances = tempChances;
      
      // Generate new wheel segments for second spin with only eligible photos
      tempSession.wheelSegments = await this.wheelEngine.generateWheelSegments(this.state.currentGallery!, tempChances);
      
      // Update the wheel renderer with the new segments
      await this.wheelRenderer.updateSegments(this.wheelEngine.getCurrentWheelSegments(tempSession));

      // Second spin animation - let it land naturally on the filtered wheel
      const secondTarget = (Math.random() * 3 + 2) * Math.PI * 2 + Math.random() * Math.PI * 2;
      await this.wheelRenderer.startSpin(secondTarget, 3000);

      // Get the actual winner from where the wheel landed
      const secondWinningSegment = this.wheelRenderer.getSegmentUnderNeedle();
      if (!secondWinningSegment) {
        this.showError('Error determining second winner from wheel');
        return;
      }

      const secondWinningPhoto = this.state.currentGallery!.photos.find(p => p.photoId === secondWinningSegment.photoId);
      if (!secondWinningPhoto) {
        this.showError('Error finding second winning photo');
        return;
      }

      const winningPhotos = [firstWinningPhoto, secondWinningPhoto];
      const winningPhotoIds = [firstWinningSegment.photoId, secondWinningSegment.photoId];

      // Highlight both winners
      this.wheelRenderer.highlightDoubleWinners(winningPhotoIds);

      // Update session state for consume mode
      this.state.playSession = this.wheelEngine.updateSessionAfterDoubleSpin(this.state.playSession, winningPhotoIds);

      // Handle consume mode segment marking (using original segments)
      if (this.state.playSession.spinMode === 'consume') {
        const originalSegments = this.wheelEngine.getCurrentWheelSegments(this.state.playSession);
        
        // Mark winning segments as consumed if safe to do so
        for (const photoId of winningPhotoIds) {
          const winningSegment = segments.find(s => s.photoId === photoId);
          if (winningSegment && originalSegments.length > winningPhotoIds.length) {
            const segmentId = `${winningSegment.photoId}_${winningSegment.startAngle}`;
            this.state.playSession = this.wheelEngine.markSegmentAsConsumed(this.state.playSession, segmentId);
          }
        }
      }

      // Display results
      await this.displayDoubleSpinResult(winningPhotos);
      this.updateSessionStats();

    } catch (error) {
      console.error('Error during double spin:', error);
      this.showError('Error during double spin');
    } finally {
      // Re-enable spin button
      const spinBtn = document.getElementById('spin-btn') as HTMLButtonElement;
      if (spinBtn) {
        spinBtn.disabled = false;
        spinBtn.textContent = 'SPIN!';
      }
    }
  }


  private async displaySingleSpinResult(winningPhoto: Photo, winningCategory: Category): Promise<void> {
    const resultContainer = document.getElementById('spin-result');
    if (!resultContainer) return;

    try {
      // Load the winning photo
      const photoBlob = await storage.getPhoto(winningPhoto.photoId);
      if (!photoBlob) {
        this.showError('Failed to load winning photo');
        return;
      }

      const imageUrl = URL.createObjectURL(photoBlob);
      
      // Update title and photos
      const titleElement = document.getElementById('result-title');
      if (titleElement) titleElement.textContent = '🎉 Winner!';

      const photo1 = document.getElementById('winning-photo-1');
      const photo2 = document.getElementById('winning-photo-2');
      
      if (photo1) {
        photo1.innerHTML = `
          <img src="${imageUrl}" alt="Winning photo">
          <div class="result-info">
            <p><strong>Category:</strong> ${winningCategory?.name || 'Uncategorized'}</p>
            <p><strong>Chance:</strong> ${winningPhoto.chance}</p>
            ${this.state.playSession?.spinMode === 'consume' ? 
              `<p><em>Remaining chances: ${(this.state.playSession.currentChances.get(winningPhoto.photoId) || 0)}</em></p>` : ''
            }
          </div>
        `;
        photo1.style.borderColor = winningCategory?.color || '#ccc';
        photo1.style.cursor = 'pointer';
        photo1.title = 'Click to view full size';
        photo1.style.display = 'block';
        
        // Add click handler for lightbox
        photo1.onclick = () => this.openLightbox(photoBlob, winningPhoto.photoId);
      }
      
      // Hide second photo for single spin
      if (photo2) {
        photo2.style.display = 'none';
      }
      
      resultContainer.style.display = 'block';
      
      // Clean up the URL object after some time
      setTimeout(() => {
        URL.revokeObjectURL(imageUrl);
      }, 10000);

    } catch (error) {
      console.error('Failed to display single spin result:', error);
      this.showError('Failed to display result');
    }
  }

  private async displayDoubleSpinResult(winningPhotos: Photo[]): Promise<void> {
    const resultContainer = document.getElementById('spin-result');
    if (!resultContainer) return;

    try {
      // Update title
      const titleElement = document.getElementById('result-title');
      if (titleElement) titleElement.textContent = '🎉 Double Winners!';

      const photo1Element = document.getElementById('winning-photo-1');
      const photo2Element = document.getElementById('winning-photo-2');
      
      // Display first photo
      if (winningPhotos[0] && photo1Element) {
        const photoBlob1 = await storage.getPhoto(winningPhotos[0].photoId);
        if (photoBlob1) {
          const imageUrl1 = URL.createObjectURL(photoBlob1);
          const category1 = this.state.currentGallery!.categories.find(c => c.categoryId === winningPhotos[0].categoryId);
          
          photo1Element.innerHTML = `
            <img src="${imageUrl1}" alt="Winning photo 1">
            <div class="result-info">
              <p><strong>Category:</strong> ${category1?.name || 'Uncategorized'}</p>
              <p><strong>Chance:</strong> ${winningPhotos[0].chance}</p>
              ${this.state.playSession?.spinMode === 'consume' ? 
                `<p><em>Remaining: ${(this.state.playSession.currentChances.get(winningPhotos[0].photoId) || 0)}</em></p>` : ''
              }
            </div>
          `;
          photo1Element.style.borderColor = category1?.color || '#ccc';
          photo1Element.style.cursor = 'pointer';
          photo1Element.title = 'Click to view full size';
          photo1Element.style.display = 'block';
          
          // Add click handler for lightbox
          photo1Element.onclick = () => this.openLightbox(photoBlob1, winningPhotos[0].photoId);
          
          // Clean up URL after delay
          setTimeout(() => URL.revokeObjectURL(imageUrl1), 10000);
        }
      }

      // Display second photo if available
      if (winningPhotos[1] && photo2Element) {
        const photoBlob2 = await storage.getPhoto(winningPhotos[1].photoId);
        if (photoBlob2) {
          const imageUrl2 = URL.createObjectURL(photoBlob2);
          const category2 = this.state.currentGallery!.categories.find(c => c.categoryId === winningPhotos[1].categoryId);
          
          photo2Element.innerHTML = `
            <img src="${imageUrl2}" alt="Winning photo 2">
            <div class="result-info">
              <p><strong>Category:</strong> ${category2?.name || 'Uncategorized'}</p>
              <p><strong>Chance:</strong> ${winningPhotos[1].chance}</p>
              ${this.state.playSession?.spinMode === 'consume' ? 
                `<p><em>Remaining: ${(this.state.playSession.currentChances.get(winningPhotos[1].photoId) || 0)}</em></p>` : ''
              }
            </div>
          `;
          photo2Element.style.borderColor = category2?.color || '#ccc';
          photo2Element.style.cursor = 'pointer';
          photo2Element.title = 'Click to view full size';
          photo2Element.style.display = 'block';
          
          // Add click handler for lightbox
          photo2Element.onclick = () => this.openLightbox(photoBlob2, winningPhotos[1].photoId);
          
          // Clean up URL after delay
          setTimeout(() => URL.revokeObjectURL(imageUrl2), 10000);
        }
      } else if (photo2Element) {
        // Hide second photo if only one winner
        photo2Element.style.display = 'none';
      }

      resultContainer.style.display = 'block';

    } catch (error) {
      console.error('Failed to display double spin result:', error);
      this.showError('Failed to display results');
    }
  }

  private async resetSession(): Promise<void> {
    if (!this.state.playSession || !this.state.currentGallery) {
      this.showError('No active session to reset');
      return;
    }

    if (!confirm('Are you sure you want to reset the session? This will restore all photo chances.')) {
      return;
    }

    // Reset the play session
    this.state.playSession = await this.wheelEngine.resetPlaySession(this.state.playSession, this.state.currentGallery);
    
    // Update UI
    this.updateSessionStats();
    this.clearPlayResults();
    await this.renderWheel();
    
    console.log('Session reset completed');
  }

  // Lightbox functionality
  private openLightbox(photoBlob: Blob, photoId: string): void {
    const lightboxOverlay = document.getElementById('photo-lightbox-overlay');
    const lightboxImage = document.getElementById('lightbox-image') as HTMLImageElement;
    const downloadBtn = document.getElementById('download-photo-btn');

    if (!lightboxOverlay || !lightboxImage || !downloadBtn) {
      console.error('Lightbox elements not found');
      return;
    }

    // Create object URL for the photo
    const imageUrl = URL.createObjectURL(photoBlob);
    
    // Set the image source
    lightboxImage.src = imageUrl;
    
    // Setup download functionality
    downloadBtn.onclick = () => this.downloadPhoto(photoBlob, photoId);
    
    // Show the lightbox
    lightboxOverlay.classList.add('active');
    
    // Store the URL for cleanup
    lightboxImage.dataset.objectUrl = imageUrl;
    
    // Add event listeners for closing
    this.setupLightboxCloseHandlers();
  }

  private setupLightboxCloseHandlers(): void {
    const lightboxOverlay = document.getElementById('photo-lightbox-overlay');
    const lightboxModal = document.getElementById('photo-lightbox-modal');
    const lightboxClose = lightboxModal?.querySelector('.lightbox-close');

    if (!lightboxOverlay || !lightboxModal || !lightboxClose) return;

    // Close button click
    lightboxClose.addEventListener('click', () => this.closeLightbox(), { once: true });
    
    // Click outside modal to close
    lightboxOverlay.addEventListener('click', (e) => {
      if (e.target === lightboxOverlay) {
        this.closeLightbox();
      }
    }, { once: true });
    
    // Escape key to close
    const escapeHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.closeLightbox();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
  }

  private closeLightbox(): void {
    const lightboxOverlay = document.getElementById('photo-lightbox-overlay');
    const lightboxImage = document.getElementById('lightbox-image') as HTMLImageElement;

    if (lightboxOverlay) {
      lightboxOverlay.classList.remove('active');
      
      // Clean up object URL
      if (lightboxImage?.dataset.objectUrl) {
        URL.revokeObjectURL(lightboxImage.dataset.objectUrl);
        delete lightboxImage.dataset.objectUrl;
        lightboxImage.src = '';
      }
    }
  }

  private downloadPhoto(photoBlob: Blob, photoId: string): void {
    try {
      // Create a download link
      const downloadUrl = URL.createObjectURL(photoBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `spinpics-photo-${photoId}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to download photo:', error);
      this.showError('Failed to download photo');
    }
  }
}