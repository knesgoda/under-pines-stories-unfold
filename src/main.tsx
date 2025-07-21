import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { createSeedData } from './lib/seedData'

// Create seed data for testing
createSeedData();

createRoot(document.getElementById("root")!).render(<App />);
