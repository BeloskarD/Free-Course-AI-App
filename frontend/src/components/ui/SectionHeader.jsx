export default function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-10 max-w-3xl">
      <h2 className="section-title">{title}</h2>
      {subtitle && (
        <p className="section-subtitle mt-2">
          {subtitle}
        </p>
      )}
    </div>
  );
}
