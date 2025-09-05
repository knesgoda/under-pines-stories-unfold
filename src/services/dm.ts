// DM services are currently disabled due to missing database schema

export interface DMMember {
  id: string
  dm_id: string  
  user_id: string
  state: 'active' | 'pending'
}

export interface DMMessage {
  id: string
  dm_id: string
  sender_id: string
  body: string
  created_at: string
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