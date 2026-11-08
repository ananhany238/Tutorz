export default function Logo({ light = false }) {
  return (
    <div className={`logo ${light ? 'logo-light' : ''}`}>
      <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill={light ? '#ffffff' : '#166a4d'} />
        <path
          d="M9 10h14M16 10v13"
          stroke={light ? '#166a4d' : '#ffffff'}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="23.5" cy="23.5" r="3" fill="#f5b82e" />
      </svg>
      <span>Tutorz</span>
    </div>
  );
}