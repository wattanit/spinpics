import type { AppState, Gallery } from './types';

export class App {
  private state: AppState = {
    currentScreen: 'home',
    currentGallery: null,
    playSession: null,
    galleries: []
  };

  async initialize(): Promise<void> {
    console.log('🎯 Initializing Photo Wheel Spinner...');
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Load initial data
    await this.loadGalleries();
    
    // Set initial screen
    this.showScreen('home');
    
    console.log('✅ App initialized successfully');
  }

  private setupEventListeners(): void {
    // Navigation
    document.getElementById('home-btn')?.addEventListener('click', () => {
      this.showScreen('home');
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
  }

  private async loadGalleries(): Promise<void> {
    try {
      // TODO: Load from storage
      this.state.galleries = [];
      this.renderGalleries();
    } catch (error) {
      console.error('Failed to load galleries:', error);
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
            <button class="btn btn-outline">Edit</button>
            <button class="btn btn-primary">Play</button>
          </div>
        </div>
      `).join('');
    }
  }

  private createGallery(): void {
    const nameInput = document.getElementById('new-gallery-name') as HTMLInputElement;
    const name = nameInput?.value?.trim();

    if (!name) {
      alert('Please enter a gallery name');
      return;
    }

    const gallery: Gallery = {
      galleryId: this.generateId(),
      name,
      spinMode: 'static',
      categories: [],
      photos: []
    };

    this.state.galleries.push(gallery);
    this.renderGalleries();
    this.hideModal('new-gallery-modal');
    nameInput.value = '';

    console.log('Gallery created:', gallery);
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
}