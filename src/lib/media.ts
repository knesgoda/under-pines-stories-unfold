import { supabase } from '@/integrations/supabase/client'

export interface MediaItem {
  type: 'image' | 'video'
  url: string
  width: number
  height: number
  bytes: number
  poster_url?: string
  duration?: number
  alt_text?: string
}

export interface ProcessedImage {
  original: Blob
  medium: Blob
  small: Blob
  width: number
  height: number
}

export const MAX_IMAGE_SIZE = 25 * 1024 * 1024 // 25MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100MB
export const MAX_VIDEO_DURATION = 60 // 60 seconds
export const MAX_IMAGES = 10
export const MAX_IMAGE_DIMENSION = 2048

export function validateImageFile(file: File): string | null {
  if (file.size > MAX_IMAGE_SIZE) {
    return 'Image too large (max 25MB before processing).'
  }
  
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic']
  if (!validTypes.includes(file.type)) {
    return 'Unsupported image format. Use JPG, PNG, WebP, GIF, or HEIC.'
  }
  
  return null
}

export function validateVideoFile(file: File): string | null {
  if (file.size > MAX_VIDEO_SIZE) {
    return 'Video too large (max 100MB) or too long (60s).'
  }
  
  const validTypes = ['video/mp4', 'video/webm']
  if (!validTypes.includes(file.type)) {
    return 'Unsupported video format. Use MP4 or WebM.'
  }
  
  return null
}

export async function processImage(file: File): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        
        // Calculate dimensions
        let { width, height } = img
        const ratio = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height)
        
        if (ratio < 1) {
          width *= ratio
          height *= ratio
        }
        
        // Create original size
        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        
        const createBlob = (targetWidth: number, quality = 0.8): Promise<Blob> => {
          return new Promise((resolve) => {
            const targetHeight = (height * targetWidth) / width
            canvas.width = targetWidth
            canvas.height = targetHeight
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
            
            canvas.toBlob((blob) => {
              if (blob) resolve(blob)
            }, 'image/webp', quality)
          })
        }
        
        Promise.all([
          createBlob(width), // original
          createBlob(Math.min(1280, width)), // medium
          createBlob(Math.min(480, width)) // small
        ]).then(([original, medium, small]) => {
          resolve({ original, medium, small, width, height })
        })
      } catch (error) {
        reject(error)
      }
    }
    
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

export async function generateVideoPoster(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.onloadeddata = () => {
      video.currentTime = Math.min(0.5, video.duration / 2)
    }
    
    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      
      canvas.width = Math.min(1280, video.videoWidth)
      canvas.height = (video.videoHeight * canvas.width) / video.videoWidth
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to generate poster'))
      }, 'image/jpeg', 0.8)
    }
    
    video.onerror = () => reject(new Error('Failed to load video'))
    video.src = URL.createObjectURL(file)
  })
}

export async function uploadToStorage(file: Blob, path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('media')
    .upload(path, file, { upsert: true })
    
  if (error) throw error
  
  const { data: urlData } = supabase.storage
    .from('media')
    .getPublicUrl(path)
    
  return urlData.publicUrl
}

export async function uploadImage(file: File, userId: string, postId: string, index: number): Promise<MediaItem> {
  const processed = await processImage(file)
  const basePath = `users/${userId}/posts/${postId}`
  
  const [origUrl, mediumUrl, smallUrl] = await Promise.all([
    uploadToStorage(processed.original, `${basePath}/img_${index}_orig.webp`),
    uploadToStorage(processed.medium, `${basePath}/img_${index}_md.webp`),
    uploadToStorage(processed.small, `${basePath}/img_${index}_sm.webp`)
  ])
  
  return {
    type: 'image',
    url: origUrl,
    width: processed.width,
    height: processed.height,
    bytes: processed.original.size
  }
}

export async function uploadVideo(file: File, userId: string, postId: string): Promise<MediaItem> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.onloadedmetadata = async () => {
      try {
        if (video.duration > MAX_VIDEO_DURATION) {
          reject(new Error('Video too long (max 60s).'))
          return
        }
        
        const poster = await generateVideoPoster(file)
        const basePath = `users/${userId}/posts/${postId}`
        
        const [videoUrl, posterUrl] = await Promise.all([
          uploadToStorage(file, `${basePath}/vid_0.${file.type.split('/')[1]}`),
          uploadToStorage(poster, `${basePath}/vid_0_poster.jpg`)
        ])
        
        resolve({
          type: 'video',
          url: videoUrl,
          poster_url: posterUrl,
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration,
          bytes: file.size
        })
      } catch (error) {
        reject(error)
      }
    }
    
    video.onerror = () => reject(new Error('Failed to load video'))
    video.src = URL.createObjectURL(file)
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${Math.round(bytes / (1024 * 1024))} MB`
}