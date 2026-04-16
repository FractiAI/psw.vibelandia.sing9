import { createRoot } from 'react-dom/client';
import { MainCanvas } from './MainCanvas';

const el = document.getElementById('digital-pru-root');
if (el) {
  createRoot(el).render(<MainCanvas />);
}
