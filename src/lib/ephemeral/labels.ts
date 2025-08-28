export const EPHEMERAL = {
  singular: 'Ember',
  plural: 'Embers',
  verbs: { create: 'Light', view: 'View', share: 'Share', react: 'Stoke' },
  ttlHours: 24,
  explain: '24-hour photos/videos',
  route: '/embers'
} as const;

export const emberExpiresAt = () => new Date(Date.now() + EPHEMERAL.ttlHours*60*60*1000).toISOString();
