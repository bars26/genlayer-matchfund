/** MatchFund mark: two coins of the same size side by side on a teal tile, the second one matching the first. */
export function BrandMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} role="img" aria-label="MatchFund">
      <rect width="32" height="32" rx="9" fill="#0E2A2F" />
      <circle cx="12" cy="16" r="6.6" fill="#F4F6F1" />
      <circle cx="20" cy="16" r="6.6" fill="#E8613F" fillOpacity="0.92" />
      <path d="M16 10.9a6.6 6.6 0 0 1 0 10.2a6.6 6.6 0 0 1 0-10.2Z" fill="#0E2A2F" fillOpacity="0.28" />
      <path d="M9.4 16h5.2M12 13.4v5.2" stroke="#0E2A2F" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17.6 14.6h4.8M17.6 17.4h4.8" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
