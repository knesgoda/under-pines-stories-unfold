// DM services are currently disabled due to missing database schema

export interface DMMember {
  id: string
  dm_id: string  
  user_id: string
  state: 'active' | 'pending'
  user?: {
    id: string
    username: string
    display_name?: string
    avatar_url?: string
  }
}

export interface DMMessage {
  id: string
  dm_id: string
  sender_id: string
  body: string
  created_at: string
  author?: {
    id: string
    username: string
    display_name?: string
    avatar_url?: string
  }
}

export interface DMThread {
  id: string
  members: DMMember[]
  last_message?: DMMessage
  unread_count: number
}

export async function getDMMembers(dmId: string): Promise<DMMember[]> {
  // DM functionality is currently disabled
  return []
}

export async function getDMMessages(dmId: string): Promise<DMMessage[]> {
  // DM functionality is currently disabled
  return []
}

export async function sendDMMessage(dmId: string, body: string): Promise<DMMessage | null> {
  // DM functionality is currently disabled
  return null
}

export async function createDM(memberUserIds: string[]): Promise<string | null> {
  // DM functionality is currently disabled
  return null
}

export async function updateDMMemberState(dmId: string, userId: string, state: 'active' | 'pending'): Promise<boolean> {
  // DM functionality is currently disabled
  return false
}

// Additional functions needed by components
export async function sendMessage(dmId: string, senderId: string, body: string): Promise<DMMessage | null> {
  // DM functionality is currently disabled
  return null
}

export async function sendTyping(dmId: string, userId: string, isTyping: boolean): Promise<void> {
  // DM functionality is currently disabled
  return
}

export async function listMessages(dmId: string, limit = 50, offset = 0): Promise<DMMessage[]> {
  // DM functionality is currently disabled
  return []
}

export async function subscribeToDM(dmId: string, callback: (message: DMMessage) => void): Promise<() => void> {
  // DM functionality is currently disabled
  return Promise.resolve(() => {})
}

export async function markAsRead(dmId: string, userId: string): Promise<void> {
  // DM functionality is currently disabled
  return
}

export async function listThreads(userId: string): Promise<DMThread[]> {
  // DM functionality is currently disabled
  return []
}