// Web app manifest — this is what lets Chrome (desktop + Android) offer "Install CardHQ".
// Next.js serves it at /manifest.webmanifest and links it from every page automatically.
export default function manifest() {
  return {
    id: '/',
    name: 'CardHQ — Sports Card & TCG Checklists',
    short_name: 'CardHQ',
    description: 'Complete checklists for sports card and TCG sets. Search any player, track your wantlist and collection.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0B0E17',
    theme_color: '#0B0E17',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
