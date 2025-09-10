import type { WheelSegment, SpinAnimation } from '../types/index.js';

export class WheelRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private segments: WheelSegment[] = [];
  private animation: SpinAnimation | null = null;
  private animationFrameId: number | null = null;
  private imageCache = new Map<string, HTMLImageElement>();
  private winningSegmentId: string | null = null;
  private winningCategoryId: string | null = null;
  private highlightAnimation: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D rendering context');
    }
    this.ctx = ctx;
    this.setupCanvas();
  }

  private setupCanvas(): void {
    // Set up high DPI rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    // Ensure minimum canvas size
    const width = Math.max(400, rect.width);
    const height = Math.max(400, rect.height);
    
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    
    console.log(`Canvas setup: ${width}x${height} (DPR: ${dpr})`);
  }

  /**
   * Updates wheel segments and redraws
   */
  async updateSegments(segments: WheelSegment[]): Promise<void> {
    this.segments = segments;
    // Skip image preloading since we're not displaying photos on wheel
    this.draw();
  }


  /**
   * Draws the wheel at the current rotation angle
   */
  private draw(currentAngle: number = 0): void {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(400, rect.width);
    const height = Math.max(400, rect.height);
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.max(150, Math.min(centerX, centerY) - 30); // Larger minimum radius

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Draw segments
    this.segments.forEach((segment) => {
      const segmentId = `${segment.photoId}_${segment.startAngle}`;
      
      // Support multiple winning segments and categories (for double spin)
      const winningSegmentIds = this.winningSegmentId ? this.winningSegmentId.split(',') : [];
      const winningCategoryIds = this.winningCategoryId ? this.winningCategoryId.split(',') : [];
      
      // Highlight if this is a winning segment OR if it belongs to a winning category
      const isWinningSegment = winningSegmentIds.includes(segmentId) || winningSegmentIds.includes(segment.photoId);
      const isWinningCategory = winningCategoryIds.includes(segment.category.categoryId);
      const isWinning = isWinningSegment || isWinningCategory;
      
      this.drawSegment(segment, centerX, centerY, radius, currentAngle, isWinning);
    });

    // Draw center circle
    this.drawCenter(centerX, centerY);

    // Draw outer border
    this.drawBorder(centerX, centerY, radius);
  }

  /**
   * Draws a single wheel segment
   */
  private drawSegment(
    segment: WheelSegment,
    centerX: number,
    centerY: number,
    radius: number,
    rotation: number,
    isWinning: boolean = false
  ): void {
    const startAngle = segment.startAngle + rotation;
    const endAngle = segment.endAngle + rotation;

    this.ctx.save();

    // Create clipping path for segment
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY);
    this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    this.ctx.closePath();
    this.ctx.clip();

    // Fill background with category color (with highlight effect for winner)
    if (isWinning) {
      const highlightIntensity = Math.sin(this.highlightAnimation * 0.1) * 0.3 + 0.7;
      this.ctx.fillStyle = this.lightenColor(segment.category.color, highlightIntensity);
    } else {
      this.ctx.fillStyle = segment.category.color;
    }
    this.ctx.fill();

    // Don't draw photos on the wheel - keep segments clean with just colors

    // Draw segment border (thicker for winner)
    this.ctx.strokeStyle = isWinning ? '#ffd700' : '#ffffff';
    this.ctx.lineWidth = isWinning ? 4 : 2;
    this.ctx.stroke();

    this.ctx.restore();
  }


  /**
   * Draws center circle
   */
  private drawCenter(centerX: number, centerY: number): void {
    this.ctx.save();
    
    // Center circle background
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fill();
    this.ctx.strokeStyle = '#333333';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  /**
   * Draws outer border
   */
  private drawBorder(centerX: number, centerY: number, radius: number): void {
    this.ctx.save();
    
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.strokeStyle = '#333333';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  /**
   * Starts spinning animation
   */
  startSpin(targetAngle: number, duration: number = 3000): Promise<void> {
    return new Promise((resolve) => {
      // Stop any existing animation
      this.stopSpin();

      // Calculate spin parameters
      const startAngle = this.animation?.currentAngle || 0;
      
      // Always ensure clockwise rotation by adding extra full rotations
      // Target should be reached by going in positive direction (clockwise)
      const fullRotations = Math.PI * 6; // 3 full clockwise rotations for effect
      
      // Normalize target angle to be greater than start angle to ensure clockwise
      let normalizedTarget = targetAngle;
      while (normalizedTarget <= startAngle) {
        normalizedTarget += Math.PI * 2; // Add full rotation until target is ahead
      }
      
      const totalRotation = normalizedTarget + fullRotations;
      
      this.animation = {
        isSpinning: true,
        currentAngle: startAngle,
        targetAngle: totalRotation,
        velocity: 0,
        startTime: performance.now(),
        duration
      };

      // Start animation loop
      const animate = (currentTime: number) => {
        if (!this.animation || !this.animation.isSpinning) {
          resolve();
          return;
        }

        const elapsed = currentTime - this.animation.startTime;
        const progress = Math.min(elapsed / this.animation.duration, 1);
        
        // Easing function for realistic deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        this.animation.currentAngle = startAngle + (totalRotation - startAngle) * easeOut;
        
        this.draw(this.animation.currentAngle);
        
        if (progress >= 1) {
          this.animation.isSpinning = false;
          this.animation.currentAngle = totalRotation;
          resolve();
        } else {
          this.animationFrameId = requestAnimationFrame(animate);
        }
      };

      this.animationFrameId = requestAnimationFrame(animate);
    });
  }

  /**
   * Stops current animation
   */
  stopSpin(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    if (this.animation) {
      this.animation.isSpinning = false;
    }
  }

  /**
   * Gets current rotation angle
   */
  getCurrentAngle(): number {
    return this.animation?.currentAngle || 0;
  }

  /**
   * Checks if wheel is currently spinning
   */
  isSpinning(): boolean {
    return this.animation?.isSpinning || false;
  }

  /**
   * Cleanup method
   */
  destroy(): void {
    this.stopSpin();
    
    // Clean up image URLs
    this.imageCache.forEach((img) => {
      if (img.src.startsWith('blob:')) {
        URL.revokeObjectURL(img.src);
      }
    });
    this.imageCache.clear();
  }

  /**
   * Highlights winning segment with animation
   * Finds the specific segment under the needle and highlights all segments of that category 
   */
  highlightWinner(winningPhotoId: string): void {
    // Find the segment that is actually under the needle after rotation
    const currentAngle = this.getCurrentAngle();
    const needleAngle = -Math.PI / 2; // Top of the wheel (12 o'clock position)
    
    // Find which segment is at the needle position
    const segmentAtNeedle = this.segments.find(segment => {
      const adjustedStartAngle = this.normalizeAngle(segment.startAngle + currentAngle);
      const adjustedEndAngle = this.normalizeAngle(segment.endAngle + currentAngle);
      const normalizedNeedleAngle = this.normalizeAngle(needleAngle);
      
      // Handle wrap-around case
      if (adjustedStartAngle > adjustedEndAngle) {
        return normalizedNeedleAngle >= adjustedStartAngle || normalizedNeedleAngle <= adjustedEndAngle;
      } else {
        return normalizedNeedleAngle >= adjustedStartAngle && normalizedNeedleAngle <= adjustedEndAngle;
      }
    });
    
    // Set the winning segment ID to the specific segment under the needle
    // If we can't find the segment at needle, fallback to any segment with winning photo
    this.winningSegmentId = segmentAtNeedle ? 
      `${segmentAtNeedle.photoId}_${segmentAtNeedle.startAngle}` : winningPhotoId;
    
    // Store the winning category to highlight all segments of that category
    const winningSegment = segmentAtNeedle || this.segments.find(s => s.photoId === winningPhotoId);
    this.winningCategoryId = winningSegment ? winningSegment.category.categoryId : null;
    
    this.startHighlightAnimation();
  }

  /**
   * Clears winner highlight
   */
  clearWinnerHighlight(): void {
    this.winningSegmentId = null;
    this.winningCategoryId = null;
    this.stopHighlightAnimation();
  }

  /**
   * Starts highlight animation loop
   */
  private startHighlightAnimation(): void {
    const animate = () => {
      if (this.winningSegmentId) {
        this.highlightAnimation++;
        this.draw(this.getCurrentAngle());
        this.animationFrameId = requestAnimationFrame(animate);
      }
    };
    this.stopHighlightAnimation();
    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Stops highlight animation
   */
  private stopHighlightAnimation(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Normalizes angle to be between -π and π
   */
  private normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle <= -Math.PI) angle += 2 * Math.PI;
    return angle;
  }

  /**
   * Lightens a hex color by a given factor
   */
  private lightenColor(hex: string, factor: number): string {
    const color = hex.replace('#', '');
    const num = parseInt(color, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    
    const newR = Math.min(255, Math.floor(r + (255 - r) * factor));
    const newG = Math.min(255, Math.floor(g + (255 - g) * factor));
    const newB = Math.min(255, Math.floor(b + (255 - b) * factor));
    
    return `rgb(${newR}, ${newG}, ${newB})`;
  }

  /**
   * Gets the segment that is currently under the needle (top of wheel)
   */
  getSegmentUnderNeedle(): WheelSegment | null {
    // Safety check: ensure we have segments
    if (this.segments.length === 0) {
      console.error('No segments available to determine winner');
      return null;
    }
    
    // If only one segment, it must be the winner
    if (this.segments.length === 1) {
      return this.segments[0];
    }
    
    const currentAngle = this.getCurrentAngle();
    const needleAngle = -Math.PI / 2; // Top of the wheel (12 o'clock position)
    
    // Find which segment is at the needle position
    const segmentAtNeedle = this.segments.find(segment => {
      const adjustedStartAngle = this.normalizeAngle(segment.startAngle + currentAngle);
      const adjustedEndAngle = this.normalizeAngle(segment.endAngle + currentAngle);
      const normalizedNeedleAngle = this.normalizeAngle(needleAngle);
      
      // Handle wrap-around case
      if (adjustedStartAngle > adjustedEndAngle) {
        return normalizedNeedleAngle >= adjustedStartAngle || normalizedNeedleAngle <= adjustedEndAngle;
      } else {
        return normalizedNeedleAngle >= adjustedStartAngle && normalizedNeedleAngle <= adjustedEndAngle;
      }
    });
    
    // Fallback: if we can't find the exact segment, return the first one
    // This can happen due to floating point precision issues
    return segmentAtNeedle || this.segments[0];
  }

  /**
   * Performs a double spin with sequential animations
   * Returns array of winning photo IDs after both spins complete
   */
  async startDoubleSpin(firstTargetAngle: number, secondTargetAngle: number, duration: number = 3000): Promise<string[]> {
    const results: string[] = [];
    
    // Clear any existing highlights
    this.clearWinnerHighlight();
    
    // First spin
    await this.startSpin(firstTargetAngle, duration);
    const firstWinner = this.getSegmentUnderNeedle();
    if (firstWinner) {
      results.push(firstWinner.photoId);
      // Highlight first winner briefly
      this.highlightWinner(firstWinner.photoId);
      await this.delay(1000); // Show first result for 1 second
      this.clearWinnerHighlight();
    }
    
    // Second spin
    await this.startSpin(secondTargetAngle, duration);
    const secondWinner = this.getSegmentUnderNeedle();
    if (secondWinner) {
      results.push(secondWinner.photoId);
    }
    
    return results;
  }

  /**
   * Highlights multiple winning segments for double spin results
   */
  highlightDoubleWinners(winningPhotoIds: string[]): void {
    // For double spin, we'll highlight the categories of both winning photos
    const winningCategories = new Set<string>();
    
    winningPhotoIds.forEach(photoId => {
      const segment = this.segments.find(s => s.photoId === photoId);
      if (segment) {
        winningCategories.add(segment.category.categoryId);
      }
    });
    
    // Store multiple winning categories (we'll modify the highlighting logic)
    this.winningCategoryId = Array.from(winningCategories).join(',');
    this.winningSegmentId = winningPhotoIds.join(','); // Store multiple photo IDs
    this.startHighlightAnimation();
  }

  /**
   * Utility method for creating delays in async sequences
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Resize canvas (call when window resizes)
   */
  resize(): void {
    this.setupCanvas();
    this.draw(this.getCurrentAngle());
  }
}