/** The reelcn mark, shared by the landing and docs navbars. `app/icon.svg` is the same drawing for the browser tab. */
export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 4v16" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 12h13" stroke="#FFB224" strokeWidth="1.8" />
    </svg>
  );
}
