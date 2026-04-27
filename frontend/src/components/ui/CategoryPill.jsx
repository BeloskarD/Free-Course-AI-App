export default function CategoryPill({ label }) {
  return (
    <span className="px-4 py-2 rounded-full border text-sm cursor-pointer hover:bg-[var(--primary-soft)] transition">
      {label}
    </span>
  );
}
