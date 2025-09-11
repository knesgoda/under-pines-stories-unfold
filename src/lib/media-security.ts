/**
 * Enhanced file upload security utilities
 */

// Magic number validation for common file types
const FILE_SIGNATURES = {
  // Images
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
  
  // Videos
  'video/mp4': [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70], // ftyp
  'video/webm': [0x1A, 0x45, 0xDF, 0xA3],
  'video/quicktime': [0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70]
};

/**
 * Validates file magic number against expected MIME type
 */
export async function validateFileSignature(file: File): Promise<boolean> {
  const expectedSignature = FILE_SIGNATURES[file.type as keyof typeof FILE_SIGNATURES];
  if (!expectedSignature) return false;
  
  const arrayBuffer = await file.slice(0, 16).arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  return expectedSignature.every((byte, index) => uint8Array[index] === byte);
}

/**
 * Validates file size limits
 */
export function validateFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
}

/**
 * Validates file type against allowed types
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Comprehensive file validation
 */
export async function validateMediaFile(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
    requireMagicNumber?: boolean;
  } = {}
): Promise<{ isValid: boolean; error?: string }> {
  const {
    maxSizeMB = 10,
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'],
    requireMagicNumber = true
  } = options;

  // File size validation
  if (!validateFileSize(file, maxSizeMB)) {
    return { isValid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }

  // File type validation
  if (!validateFileType(file, allowedTypes)) {
    return { isValid: false, error: 'File type not allowed' };
  }

  // Magic number validation
  if (requireMagicNumber) {
    try {
      const isValidSignature = await validateFileSignature(file);
      if (!isValidSignature) {
        return { isValid: false, error: 'File signature does not match declared type' };
      }
    } catch (error) {
      return { isValid: false, error: 'Failed to validate file signature' };
    }
  }

  return { isValid: true };
}

/**
 * Rate limiter for file uploads
 */
class UploadRateLimiter {
  private uploads: Map<string, number[]> = new Map();

  isAllowed(userId: string, maxUploads: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const userUploads = this.uploads.get(userId) || [];
    
    // Remove uploads outside the window
    const validUploads = userUploads.filter(time => now - time < windowMs);
    
    if (validUploads.length >= maxUploads) {
      return false;
    }
    
    // Add current upload
    validUploads.push(now);
    this.uploads.set(userId, validUploads);
    
    return true;
  }

  reset(userId: string): void {
    this.uploads.delete(userId);
  }
}

export const uploadRateLimiter = new UploadRateLimiter();