import DOMPurify from 'dompurify';

/**
 * Sanitizes user input to prevent XSS attacks
 */
export function sanitizeUserInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
}

/**
 * Validates and sanitizes form input
 */
export function validateFormInput(
  input: string, 
  options: {
    maxLength?: number;
    minLength?: number;
    required?: boolean;
  } = {}
): { isValid: boolean; sanitized: string; error?: string } {
  const { maxLength = 5000, minLength = 0, required = false } = options;
  
  // Check if required
  if (required && !input.trim()) {
    return { isValid: false, sanitized: '', error: 'This field is required' };
  }
  
  // Sanitize the input
  const sanitized = sanitizeUserInput(input);
  
  // Check length constraints
  if (sanitized.length < minLength) {
    return { 
      isValid: false, 
      sanitized, 
      error: `Must be at least ${minLength} characters` 
    };
  }
  
  if (sanitized.length > maxLength) {
    return { 
      isValid: false, 
      sanitized, 
      error: `Must be no more than ${maxLength} characters` 
    };
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(input)) {
      return { 
        isValid: false, 
        sanitized, 
        error: 'Invalid content detected' 
      };
    }
  }
  
  return { isValid: true, sanitized };
}

/**
 * Rate limiting helper for form submissions
 */
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  isAllowed(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove attempts outside the window
    const validAttempts = attempts.filter(time => now - time < windowMs);
    
    if (validAttempts.length >= maxAttempts) {
      return false;
    }
    
    // Add current attempt
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    
    return true;
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new RateLimiter();