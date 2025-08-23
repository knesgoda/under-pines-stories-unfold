# Under Pines - Media Posts System

This document outlines the media posts functionality that allows users to create posts with images and videos.

## Overview

Users can now create posts up to 2500 characters with optional media attachments:
- **Images**: Up to 10 images per post, auto-compressed and resized
- **Videos**: Single video per post with auto-generated poster thumbnails
- **Mixed media**: Not supported in MVP (images OR video, not both)

## Technical Implementation

### Database Schema

```sql
-- Posts table extensions
ALTER TABLE posts 
ADD CONSTRAINT posts_body_check CHECK (char_length(body) <= 2500);
ADD COLUMN media jsonb DEFAULT '[]'::jsonb;
ADD COLUMN has_media boolean GENERATED ALWAYS AS (jsonb_array_length(media) > 0) STORED;
```

### Storage Structure

```
Bucket: media (public)
Path: users/{user_id}/posts/{post_id}/
Files:
  - Images: img_{n}_orig.webp, img_{n}_md.webp, img_{n}_sm.webp
  - Videos: vid_{n}.mp4|webm, vid_{n}_poster.jpg
```

### Media Processing

#### Images
- **Input**: JPG, PNG, WebP, GIF, HEIC (max 25MB)
- **Processing**: Client-side canvas resizing to create 3 variants:
  - Small: 480px max width (for previews)
  - Medium: 1280px max width (for feed display)  
  - Original: 2048px max width (for lightbox)
- **Output**: WebP format (q=0.8), fallback to JPEG (q=0.82)
- **Privacy**: EXIF data stripped during processing

#### Videos
- **Input**: MP4 (H.264/AAC) or WebM (max 100MB, 60s duration)
- **Processing**: 
  - Poster generation at 0.5s timestamp
  - Poster resized to 1280px max width
  - No transcoding (device encoding relied upon)
- **Output**: Original video + JPEG poster

## API Usage

### Creating Posts with Media

```typescript
import { createPost } from '@/lib/posts'
import { uploadImage, uploadVideo } from '@/lib/media'

// Upload media first
const mediaItems = await Promise.all(
  selectedFiles.map((file, index) => 
    uploadImage(file, userId, postId, index)
  )
)

// Create post with media
const post = await createPost(text, mediaItems)
```

### Media Item Structure

```typescript
interface MediaItem {
  type: 'image' | 'video'
  url: string          // Public URL to original/video file
  width: number        // Original dimensions
  height: number
  bytes: number        // File size after compression
  poster_url?: string  // Video poster URL
  duration?: number    // Video duration in seconds
  alt_text?: string    // Accessibility description
}
```

## UI Components

### Media Upload
- `MediaPicker`: File selection with validation and previews
- Real-time file size display during selection
- Progress indication during upload/processing

### Media Display
- `MediaGrid`: Responsive grid layout for images
- `MediaLightbox`: Full-screen image viewer with navigation
- `VideoPlayer`: Inline video playback with controls
- Lazy loading for performance

### Feed Display Rules
- **1 image**: Full-width display, click for lightbox
- **2-4 images**: Grid layout with aspect ratio preservation
- **5+ images**: 2x2 grid with "+N more" indicator
- **Video**: Poster with play button, inline playback on click

## File Limits & Validation

| Media Type | Max Size | Max Duration | Max Count | Formats |
|------------|----------|--------------|-----------|---------|
| Images | 25MB (before processing) | N/A | 10 | JPG, PNG, WebP, GIF, HEIC |
| Video | 100MB | 60 seconds | 1 | MP4, WebM |

## Security & Privacy

### Storage RLS Policies
- Users can only upload to `users/{auth.uid()}/` paths
- All users can read media (public bucket)
- Users can update/delete only their own media

### Privacy Features
- EXIF data automatically stripped from images
- Video metadata preserved (duration, dimensions only)
- No server-side processing logs retained

## Performance Considerations

### Client-side Optimization
- Images compressed before upload (reduces bandwidth)
- Multiple size variants for responsive loading
- Lazy loading with `loading="lazy"` attribute
- `content-visibility: auto` for long feeds

### Browser Support
- WebP with JPEG fallback for older browsers
- Canvas-based processing (IE11+ support)
- Video playback requires HTML5 video support

## Error Handling

### User-Friendly Messages
```
- "Image too large (max 25MB before processing)."
- "Video too large (max 100MB) or too long (60s)."  
- "Unsupported format. Use JPG, PNG, WebP, GIF, or HEIC."
- "Upload failed — tap to retry."
```

### Retry Mechanisms
- Individual file upload retry (doesn't lose post text)
- Graceful degradation on processing failures
- Offline queue support (future enhancement)

## Accessibility

### Image Accessibility
- ALT text prompts during upload
- Keyboard navigation in lightbox (Arrow keys, Escape)
- Focus management for screen readers

### Video Accessibility  
- Optional caption support (future)
- Keyboard controls (Spacebar play/pause)
- Poster images with descriptive text

## Future Enhancements

### Near-term (Next Release)
- Image ALT text editing post-upload
- Video captions/subtitles support
- Mixed media posts (images + video)
- Batch image operations (rotate, crop)

### Long-term Roadmap
- Server-side video transcoding (Mux/HLS)
- Advanced video features (trim, filters)
- Image filters and editing tools
- CDN optimization for global delivery
- Live photo support (iOS)

## Monitoring & Analytics

### Key Metrics
- Upload success/failure rates
- Processing time distributions  
- File size distributions by type
- User engagement with media posts

### Error Tracking
- Client-side processing failures
- Upload timeout/retry patterns
- Storage quota usage by user

## Configuration

### Adjustable Limits (Environment)
```typescript
// src/lib/media.ts
export const MAX_IMAGE_SIZE = 25 * 1024 * 1024      // 25MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024     // 100MB  
export const MAX_VIDEO_DURATION = 60                // 60s
export const MAX_IMAGES = 10                        // 10 images
export const MAX_IMAGE_DIMENSION = 2048             // 2048px
```

### Storage Configuration
```sql
-- Increase limits if needed
UPDATE storage.buckets 
SET file_size_limit = 104857600  -- 100MB
WHERE id = 'media';
```

## Troubleshooting

### Common Issues

**Images not displaying**
- Check bucket public access: `SELECT public FROM storage.buckets WHERE id = 'media'`
- Verify RLS policies allow SELECT for authenticated users

**Upload failures**
- Check browser console for CORS errors
- Verify user authentication status
- Check file size against limits

**Video playback issues**
- Ensure H.264 codec compatibility
- Check poster image generation success
- Verify video duration validation

**Performance issues**
- Enable lazy loading on images
- Check image compression settings
- Monitor bundle size with media dependencies

### Debug Tools
```typescript
// Enable detailed logging
localStorage.setItem('debug', 'media:*')

// Check processed file sizes
console.log('Original:', file.size, 'Processed:', blob.size)

// Monitor upload progress
supabase.storage.from('media').upload(path, file, {
  onUploadProgress: (progress) => console.log(progress)
})
```

---

For questions or issues, please check the browser console logs and network requests for detailed error information.