# Requirements Document - Photo Wheel Spinner v1.1

## Introduction

This document outlines the requirements for version 1.1 of the Photo Wheel Spinner PWA, building upon the existing v1.0 functionality. Version 1.1 introduces two key enhancements: a lightbox feature for viewing and downloading reward photos, and the ability to set cover photos for galleries to improve visual organization and user experience.

These features maintain the core philosophy of the application - privacy-first, offline-capable, and highly customizable - while adding valuable functionality that enhances the user's interaction with their photo collections.

## Requirements

### Requirement 1: Lightbox Photo Viewer

**User Story:** As a user, I want to click on a reward photo after spinning the wheel to open it in a lightbox view, so that I can see the photo in full detail and have the option to download it.

#### Acceptance Criteria

1. WHEN a user completes a wheel spin and a reward photo is displayed THEN the system SHALL make the reward photo clickable
2. WHEN a user clicks on the reward photo THEN the system SHALL open a lightbox overlay displaying the photo at full resolution
3. WHEN the lightbox is open THEN the system SHALL display the photo centered on screen with a dark overlay background
4. WHEN the lightbox is open THEN the system SHALL provide a download button that allows users to save the photo to their device
5. WHEN the lightbox is open THEN the system SHALL provide a close button (X) to dismiss the lightbox
6. WHEN a user clicks outside the photo area in the lightbox THEN the system SHALL close the lightbox
7. WHEN a user presses the Escape key while the lightbox is open THEN the system SHALL close the lightbox
8. WHEN the lightbox is open THEN the system SHALL prevent scrolling of the background content
9. WHEN downloading a photo THEN the system SHALL use the original filename or generate a meaningful filename based on the gallery and photo information

### Requirement 2: Gallery Cover Photo Selection

**User Story:** As a user, I want to select a cover photo for each gallery from the photos within that gallery, so that I can easily identify and visually distinguish between my different galleries on the main screen.

#### Acceptance Criteria

1. WHEN a user is editing a gallery THEN the system SHALL provide an option to select a cover photo from the existing photos in that gallery
2. WHEN no cover photo is selected for a gallery THEN the system SHALL display a default placeholder image or the first photo in the gallery as the cover
3. WHEN a user selects a cover photo THEN the system SHALL save this selection as part of the gallery configuration
4. WHEN displaying the gallery list on the main screen THEN the system SHALL show each gallery's cover photo as a thumbnail alongside the gallery name
5. WHEN a cover photo is deleted from a gallery THEN the system SHALL automatically reset the cover photo to the default or first available photo
6. WHEN a gallery has no photos THEN the system SHALL display a default placeholder image as the cover
7. WHEN displaying cover photos THEN the system SHALL maintain consistent aspect ratios and sizing across all gallery thumbnails
8. WHEN a user hovers over or taps a gallery cover photo THEN the system SHALL provide visual feedback indicating the gallery is selectable

### Requirement 3: Enhanced Photo Management Integration

**User Story:** As a user, I want the new lightbox and cover photo features to integrate seamlessly with existing photo management functionality, so that my workflow remains intuitive and efficient.

#### Acceptance Criteria

1. WHEN managing photos within a gallery THEN the system SHALL allow users to set cover photos directly from the photo management interface
2. WHEN a photo is set as a cover photo THEN the system SHALL provide visual indication in the photo management interface
3. WHEN viewing photos in the gallery management interface THEN the system SHALL allow users to preview photos using the same lightbox functionality
4. WHEN the lightbox is used in management mode THEN the system SHALL include additional options relevant to photo management (such as setting as cover photo)
5. WHEN a user removes the current cover photo from a gallery THEN the system SHALL prompt the user to select a new cover photo or automatically select the next available photo

### Requirement 4: Data Model Updates

**User Story:** As a developer, I want the data model to support cover photo selection, so that the new functionality can be properly persisted and maintained.

#### Acceptance Criteria

1. WHEN a gallery is created or updated THEN the system SHALL store the cover photo ID as part of the gallery configuration
2. WHEN no cover photo is explicitly set THEN the system SHALL handle this gracefully without breaking existing functionality
3. WHEN migrating from v1.0 to v1.1 THEN the system SHALL automatically handle galleries without cover photo settings
4. WHEN storing gallery data THEN the system SHALL maintain backward compatibility with v1.0 data structures
5. WHEN a cover photo ID references a deleted photo THEN the system SHALL automatically clear the invalid reference and select a new cover photo