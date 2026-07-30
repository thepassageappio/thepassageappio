const passageIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#f4efe7"/>
  <rect x="14" y="32" width="9" height="17" rx="4.5" fill="#9baab4"/>
  <rect x="28" y="13" width="9" height="36" rx="4.5" fill="#6f687f"/>
  <rect x="42" y="24" width="9" height="25" rx="4.5" fill="#9aa68e"/>
</svg>`;

export function GET() {
  return new Response(passageIcon, {
    headers: {
      'Cache-Control': 'public, max-age=86400',
      'Content-Type': 'image/svg+xml; charset=utf-8',
    },
  });
}
