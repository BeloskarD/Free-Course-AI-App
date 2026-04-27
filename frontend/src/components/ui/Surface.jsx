export default function Surface({ children, className = "", ...props }) {
  return (
    <div
      className={`
        rounded-[2rem]
        bg-[var(--card-bg)]
        border-2 border-[var(--card-border)]
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
