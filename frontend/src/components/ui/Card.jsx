export default function Card({ children, className = "" }) {
  return (
    <div
      className={`
        rounded-[2rem]
        bg-[var(--card-bg)]
        border-2 border-[var(--card-border)]
        shadow-sm hover:shadow-xl hover:shadow-blue-500/5
        transition-all duration-300
        ${className}
      `}
    >
      {children}
    </div>
  );
}
