/** Bola de futebol em SVG próprio (traço e preenchimento seguem a cor do texto). */
export function IconeBola({ className = "size-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.5" />
      <polygon points="12,8.2 15.4,10.6 14.1,14.6 9.9,14.6 8.6,10.6" fill="currentColor" stroke="none" />
      <path d="M12 8.2V2.8M15.4 10.6l5-1.6M14.1 14.6l3 4.2M9.9 14.6l-3 4.2M8.6 10.6l-5-1.6" />
    </svg>
  );
}
