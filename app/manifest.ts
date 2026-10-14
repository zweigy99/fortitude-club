import type { MetadataRoute } from 'next';
import icon192 from '@/components/app-icon-192.png';
import icon512 from '@/components/app-icon-512.png';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fortitude Club',
    short_name: 'Fortitude',
    description: 'Your Fortitude Club membership card and member offers.',
    start_url: '/card',
    scope: '/',
    display: 'standalone',
    background_color: '#f8f6f1',
    theme_color: '#f8f6f1',
    icons: [
      { src: icon192.src, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: icon512.src, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: icon512.src, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
