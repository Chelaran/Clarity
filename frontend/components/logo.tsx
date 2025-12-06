// Логотип Clarity - минималистичная буква C с точкой в центре
// Идея: буква C (Clarity) с точкой, символизирующей фокус и ясность в управлении финансами

export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="8" className="fill-slate-900 dark:fill-slate-100" />
      <path
        d="M20 12C15.6 12 12 15.6 12 20C12 24.4 15.6 28 20 28"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="stroke-slate-100 dark:stroke-slate-900"
        fill="none"
      />
      <circle cx="20" cy="20" r="1.5" className="fill-slate-100 dark:fill-slate-900" />
    </svg>
  )
}
