# Requirement Specification: Photo Wheel Spinner PWA

  - **Version:** 1.1
  - **Date:** September 9, 2025

## 1\. Introduction & Overview

### 1.1. Project Summary

This document outlines the requirements for a progressive web app (PWA) named "Photo Wheel Spinner." The application will allow users to create highly customizable spinning wheel games based on photos they upload. Users can group photos into categories with unique colors, assign weighted chances to each photo, and choose between different gameplay modes. The application will be a pure frontend-only PWA, with all data stored locally in the user's browser, ensuring privacy and full offline functionality.

## 2\. Core Philosophy & Scope

### 2.1. Core Philosophy

  - **User Privacy First:** No user data or photos will be uploaded to any server. All operations are client-side.
  - **Offline Capable:** As a PWA, the app should be installable on a user's device and fully functional without an internet connection.
  - **High Customizability:** The user should have significant control over the look and behavior of their games.
  - **Fun & Engaging UI:** The experience should be visually appealing and enjoyable to use.

### 2.2. Scope for Version 1.0

#### 2.2.1. In Scope

  - Creation, editing, and deletion of multiple "Galleries" (game levels).
  - Management of "Categories" within each gallery, including a name and an assigned color.
  - Uploading multiple photos into a gallery.
  - Assignment of a weighted "chance" to each photo.
  - Assignment of each photo to a user-created category.
  - Configuration of one of two spin modes for each gallery:
    1.  **Static Mode:** Chances remain unchanged after each spin.
    2.  **Consume Mode:** The chance of a winning photo is reduced for the duration of a play session.
  - Local data persistence using browser storage (Local Storage and IndexedDB).
  - A responsive, mobile-first user interface.

#### 2.2.2. Out of Scope

  - User accounts and cloud synchronization.
  - Sharing, exporting, or importing galleries.
  - A "Collection" or "Trophy Room" to track winnings.
  - Sound effects.

## 3\. Functional Requirements

### FR1: Gallery Management

  - **FR1.1:** As a user, I want to create a new gallery and give it a unique name so I can organize my different games.
  - **FR1.2:** As a user, I want to see a list of all my saved galleries on the main screen so I can choose which one to play or edit.
  - **FR1.3:** As a user, I want to edit the name and settings of an existing gallery.
  - **FR1.4:** As a user, I want to delete a gallery I no longer need.

### FR2: Category Management (within a Gallery)

  - **FR2.1:** As a user, I want to create a new category within a gallery, giving it a name (e.g., "Common," "Rare") and a specific color using a color picker.
  - **FR2.2:** As a user, I want to edit the name and color of an existing category.
  - **FR2.3:** As a user, I want to delete a category. If a category is deleted, the photos within it should become "uncategorized."

### FR3: Photo Management (within a Gallery)

  - **FR3.1:** As a user, I want to upload one or more photos from my device into a gallery.
  - **FR3.2:** As a user, for each photo, I want to assign it to a category from a dropdown list of categories I have created.
  - **FR3.3:** As a user, for each photo, I want to set a numerical value for its "chance" to be chosen.
  - **FR3.4:** As a user, I want to remove a photo from a gallery.

### FR4: Game Configuration (within a Gallery)

  - **FR4.1:** As a user, I want to set a "Spin Mode" for each gallery, choosing between "Static" and "Consume."

### FR5: Gameplay / Play Mode

  - **FR5.1:** As a user, I want to select a gallery from my list to start a play session.
  - **FR5.2:** As a user, I want to see a spinning wheel that is dynamically generated based on the photos and categories of the selected gallery. Each segment's background color should match its photo's category color.
  - **FR5.3:** As a user, I want to click a "Spin" button to start the wheel animation.
  - **FR5.4:** As a user, I want the wheel to land on a single photo, determined by the weighted chance algorithm.
  - **FR5.5:** As a user, I want the winning photo to be displayed prominently after the spin is complete.
  - **FR5.6:** As a user playing in "Consume" mode, the chance of the winning photo must be reduced by one for the remainder of the current play session.
  - **FR5.7:** As a user playing in "Consume" mode, I want a "Reset Session" button to restore all chances to their original values and start over.

## 4\. Non-Functional Requirements

  - **NFR1: Technology Stack:** The application must be a pure frontend application using HTML5, CSS3, and JavaScript. It will not have a backend server. It must be implemented as a Progressive Web App (PWA) with a Service Worker and a Web App Manifest.
  - **NFR2: Data Storage:** Application metadata (gallery structure, categories, chances, settings) must be stored in the browser's **Local Storage**. The actual photo files must be stored as `Blob`s in the browser's **IndexedDB** for performance and to overcome size limitations.
  - **NFR3: Performance:** The UI must be responsive and fluid. Wheel animations should target 60 frames per second on modern devices.
  - **NFR4: Compatibility:** The application must be fully functional on the latest versions of major evergreen browsers (Chrome, Firefox, Safari, Edge) on both desktop and mobile platforms.
  - **NFR5: Offline Capability:** Once the PWA is installed, it must be fully operational without an active internet connection.

## 5\. Data Model

The data for a single gallery will be structured as a JSON object in Local Storage as follows:

```json
{
  "galleryId": "unique-id-string-for-gallery",
  "name": "Name of the Gallery",
  "spinMode": "consume",
  "categories": [
    { 
      "categoryId": "unique-id-for-category-1", 
      "name": "Category Name 1", 
      "color": "#HEXCODE" 
    },
    { 
      "categoryId": "unique-id-for-category-2", 
      "name": "Category Name 2", 
      "color": "#HEXCODE" 
    }
  ],
  "photos": [
    { 
      "photoId": "unique-id-for-photo-1-in-indexeddb", 
      "chance": 10, 
      "categoryId": "unique-id-for-category-1" 
    },
    { 
      "photoId": "unique-id-for-photo-2-in-indexeddb", 
      "chance": 1, 
      "categoryId": "unique-id-for-category-2" 
    }
  ]
}
```

## 6\. Version 1.1 Features

### 6.1. Photo Lightbox Feature ✅ COMPLETED

  - **FR6.1:** ✅ As a user, after winning a photo in a spin, I want to click on the winning photo to open it in a lightbox modal with a larger view.
  - **FR6.2:** ✅ As a user, within the lightbox, I want a download button to save the photo to my device.
  - **FR6.3:** ✅ As a user, I want to close the lightbox by clicking outside it, pressing the escape key, or clicking a close button.

**Implementation Details:**
- Dedicated lightbox overlay system separate from other modals
- Full-size photo display with dark background
- Download functionality using blob URLs with automatic filename generation
- Multiple close methods: ESC key, outside click, close button
- Mobile-responsive design with optimized photo sizing
- Proper resource management with automatic cleanup of object URLs

### 6.2. Gallery Cover Photo Selection

  - **FR7.1:** As a user, I want to select a cover photo for each gallery from the photos within that gallery.
  - **FR7.2:** As a user, I want to see the cover photo displayed on each gallery card in the home screen gallery list.
  - **FR7.3:** As a user, I want the system to automatically use the first uploaded photo as the default cover if no cover is explicitly selected.
  - **FR7.4:** As a user, I want to change the gallery cover photo through the gallery settings tab.

### 6.3. Data Model Updates for V1.1

The Gallery interface will be extended to include:

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

## 7\. Future Enhancements (Post-V1.1)

  - Sound Effects for wheel spinning and winning.
  - A "Collection Tracker" to show which prizes have been won in a "Consume" mode session.
  - An "Export/Import Gallery" feature to allow users to share their creations.
  - Advanced wheel appearance customization options.
  - Photo editing capabilities within the app (crop, resize, filters).
  - Animated transitions between screens and modals.
