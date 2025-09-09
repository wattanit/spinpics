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
          <h3>${gallery.name}</h3>
          <p>${gallery.photos.length} photos • ${gallery.categories.length} categories</p>
          <p>Mode: ${gallery.spinMode}</p>
          <div class="gallery-actions">
            <button class="btn btn-outline" onclick="app.editGallery('${gallery.galleryId}')">Edit</button>
            <button class="btn btn-primary" onclick="app.playGallery('${gallery.galleryId}')">Play</button>
          </div>
        </div>
      `).join('');
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

    // Render photos, categories, and set default tab
    this.renderPhotos();
    this.renderCategories();
    this.switchTab('photos');
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
      await storage.saveGallery(this.state.currentGallery);
      
      // Update in galleries array
      const galleryIndex = this.state.galleries.findIndex(g => g.galleryId === this.state.currentGallery!.galleryId);
      if (galleryIndex >= 0) {
        this.state.galleries[galleryIndex] = this.state.currentGallery;
      }

      this.renderPhotos();
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

  async editCategory(_categoryId: string): Promise<void> {
    // TODO: Implement edit category modal/inline editing
    this.showError('Edit category feature coming soon!');
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
    
    const name = nameInput?.value?.trim();
    const spinMode = spinModeSelect?.value as 'static' | 'consume';

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

      await storage.saveGallery(this.state.currentGallery);
      
      // Update in galleries array
      const galleryIndex = this.state.galleries.findIndex(g => g.galleryId === this.state.currentGallery!.galleryId);
      if (galleryIndex >= 0) {
        this.state.galleries[galleryIndex] = this.state.currentGallery;
      }

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
      resultContainer.innerHTML = '';
      resultContainer.style.display = 'none';
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
      this.state.playSession = this.wheelEngine.updateWheelForNextSpin(this.state.playSession);

      // Get current wheel segments after cleanup
      const segments = this.wheelEngine.getCurrentWheelSegments(this.state.playSession);
      
      // Re-render wheel with updated segments if any were removed
      await this.renderWheel();

      if (segments.length === 0) {
        this.showError('No eligible photos to spin! All chances may be consumed.');
        return;
      }

      // Generate random spin (2-5 full rotations + random angle)
      const baseRotations = (Math.random() * 3 + 2) * Math.PI * 2; // 2-5 full rotations
      const randomAngle = Math.random() * Math.PI * 2; // Random final position
      const targetAngle = baseRotations + randomAngle;

      // Perform wheel spin animation
      await this.wheelRenderer.startSpin(targetAngle, 3000);

      // Determine winner based on which segment ended up under the needle
      const winningSegment = this.wheelRenderer.getSegmentUnderNeedle();
      if (!winningSegment) {
        this.showError('Error determining winning segment - no segments available');
        // Re-enable spin button
        const spinBtn = document.getElementById('spin-btn') as HTMLButtonElement;
        if (spinBtn) {
          spinBtn.disabled = false;
          spinBtn.textContent = 'Spin';
        }
        return;
      }

      const winningPhotoId = winningSegment.photoId;

      // Highlight the winning segment
      this.wheelRenderer.highlightWinner(winningPhotoId);

      // Find winning photo and get category from segment
      const winningPhoto = this.state.currentGallery.photos.find(p => p.photoId === winningPhotoId);
      
      if (!winningPhoto) {
        this.showError('Error finding winning photo');
        return;
      }

      // Use category directly from the winning segment (guaranteed to exist)
      const winningCategory = winningSegment.category;

      // Update session state for consume mode  
      this.state.playSession = this.wheelEngine.updateSessionAfterSpin(this.state.playSession, winningPhotoId);
      
      // Mark the specific winning segment for removal on next spin (consume mode only)
      // But don't consume if it would leave the game unplayable
      if (this.state.playSession.spinMode === 'consume') {
        const currentSegments = this.wheelEngine.getCurrentWheelSegments(this.state.playSession);
        
        // Only consume the segment if there will be more than 1 segment remaining
        if (currentSegments.length > 1) {
          const winningSegmentId = `${winningSegment.photoId}_${winningSegment.startAngle}`;
          this.state.playSession = this.wheelEngine.markSegmentAsConsumed(this.state.playSession, winningSegmentId);
        } else {
          console.log('Last segment - not consuming to keep game playable');
        }
      }

      // Display result
      await this.displaySpinResult(winningPhoto, winningCategory);

      // Update session stats but do NOT re-render wheel yet (keep winning segment visible)
      this.updateSessionStats();

    } catch (error) {
      console.error('Error during spin:', error);
      this.showError('Error during spin');
    } finally {
      // Re-enable spin button
      const spinBtn = document.getElementById('spin-btn') as HTMLButtonElement;
      if (spinBtn) {
        spinBtn.disabled = false;
        spinBtn.textContent = 'Spin';
      }
    }
  }


  private async displaySpinResult(winningPhoto: Photo, winningCategory: Category): Promise<void> {
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
      
      resultContainer.innerHTML = `
        <div class="result-content">
          <h3>🎉 Winner!</h3>
          <div class="winning-photo" style="border-color: ${winningCategory?.color || '#ccc'}; cursor: pointer;" title="Click to view full size">
            <img src="${imageUrl}" alt="Winning photo">
          </div>
          <div class="result-info">
            <p><strong>Category:</strong> ${winningCategory?.name || 'Uncategorized'}</p>
            <p><strong>Chance:</strong> ${winningPhoto.chance}</p>
            ${this.state.playSession?.spinMode === 'consume' ? 
              `<p><em>Remaining chances: ${(this.state.playSession.currentChances.get(winningPhoto.photoId) || 0)}</em></p>` : ''
            }
          </div>
        </div>
      `;
      
      resultContainer.style.display = 'block';

      // Add click handler to winning photo for lightbox
      const winningPhotoElement = resultContainer.querySelector('.winning-photo');
      if (winningPhotoElement) {
        winningPhotoElement.addEventListener('click', () => {
          this.openLightbox(photoBlob, winningPhoto.photoId);
        });
      }
      
      // Clean up the URL object after some time
      setTimeout(() => {
        URL.revokeObjectURL(imageUrl);
      }, 10000);

    } catch (error) {
      console.error('Failed to display result:', error);
      this.showError('Failed to display result');
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