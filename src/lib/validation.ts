// Username validation for Under Pines beta authentication
export const validateUsername = (username: string) => {
  // Check length (3-20 characters)
  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' };
  }
  
  if (username.length > 20) {
    return { isValid: false, error: 'Username must be 20 characters or less' };
  }

  // Check format (letters, numbers, underscore only)
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return { isValid: false, error: 'Only letters, numbers, and underscore allowed' };
  }

  // Check that it doesn't start or end with underscore
  if (username.startsWith('_') || username.endsWith('_')) {
    return { isValid: false, error: 'Username cannot start or end with underscore' };
  }

  // Check for reserved usernames
  const reservedUsernames = [
    'admin', 'root', 'api', 'www', 'mail', 'ftp', 
    'underpines', 'support', 'help', 'beta', 'test'
  ];
  
  if (reservedUsernames.includes(username.toLowerCase())) {
    return { isValid: false, error: 'This username is reserved' };
  }

  return { isValid: true };
};

// Password validation
export const validatePassword = (password: string) => {
  // Minimum 8 characters
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }

  // Must contain at least one letter and one number
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  if (!hasLetter || !hasNumber) {
    return { isValid: false, error: 'Password must contain both letters and numbers' };
  }

  return { isValid: true };
};

// Create synthetic email for beta auth
export const createSyntheticEmail = (username: string): string => {
  return `${username}@beta.underpines.local`;
};

// Extract username from synthetic email
export const extractUsernameFromEmail = (email: string): string | null => {
  if (email.endsWith('@beta.underpines.local')) {
    return email.replace('@beta.underpines.local', '');
  }
  return null;
};