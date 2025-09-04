/**
 * Safe cleanup helper for various subscription types
 * Handles different return types from Supabase and other libraries
 */
export function safeCleanup(handle: any): void {
  try {
    if (!handle) return;
    
    // If it's a function, call it directly
    if (typeof handle === 'function') { 
      handle(); 
      return; 
    }
    
    // Supabase auth subscription pattern
    if (handle?.data?.subscription?.unsubscribe) { 
      handle.data.subscription.unsubscribe(); 
      return; 
    }
    
    // Direct unsubscribe method
    if (handle?.unsubscribe) { 
      handle.unsubscribe(); 
      return; 
    }
    
    // Channel with unsubscribe
    if (handle?.channel && typeof handle.channel.unsubscribe === 'function') { 
      handle.channel.unsubscribe(); 
      return; 
    }
    
    // Generic destroy method
    if (handle?.destroy) { 
      handle.destroy(); 
      return; 
    }
    
    // If none of the above, log for debugging
    console.debug('safeCleanup: unknown handle type', typeof handle, handle);
  } catch (error) { 
    console.debug('safeCleanup failed:', error); 
  }
}
