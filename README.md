# Under Pines - Social Community

A cozy social community for outdoor enthusiasts built with React, Vite, Tailwind, and Supabase.

## Features

- **Social Feed**: Share posts, photos, and stories with the community
- **Friend System**: Connect with other outdoor enthusiasts
- **Real-time Updates**: Live notifications and messaging
- **Hashtags & Mentions**: Discover content and connect with others
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Pacific Northwest Theme**: Warm, nature-inspired design

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Icons**: Lucide React
- **Deployment**: GitHub Actions with automatic deployment

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/knesgoda/under-pines-stories-unfold.git
cd under-pines-stories-unfold
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Add your Supabase credentials to `.env.local`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run typecheck` - Run TypeScript checks
- `npm run lint` - Run ESLint
- `npm run dep:cycles` - Check for circular dependencies

### Database Setup

The project uses Supabase migrations. Run migrations in your Supabase dashboard or using the Supabase CLI.

## Deployment

The project is automatically deployed via GitHub Actions when changes are pushed to the main branch.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue on GitHub or contact the development team.