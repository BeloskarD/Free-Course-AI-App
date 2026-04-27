export default function FilterSidebar() {
  return (
    <aside className="card p-5 sticky top-24 h-[calc(100vh-7rem)] overflow-hidden">
      <h3 className="font-semibold text-sm mb-4">Filters</h3>

      <div className="space-y-6 overflow-y-auto pr-2 text-sm">
        {/* Course Type */}
        <div>
          <p className="font-medium mb-2">Course Type</p>
          <div className="space-y-1 muted">
            <label className="flex items-center gap-2">
              <input type="checkbox" /> Free
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" /> Paid
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" /> YouTube
            </label>
          </div>
        </div>

        {/* Price */}
        <div>
          <p className="font-medium mb-2">Price</p>
          <div className="space-y-1 muted">
            <label className="flex items-center gap-2">
              <input type="checkbox" /> ₹400 – ₹600
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" /> ₹600 – ₹800
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" /> ₹800 – ₹1000
            </label>
          </div>
        </div>

        {/* Language */}
        <div>
          <p className="font-medium mb-2">Language</p>
          <div className="space-y-1 muted">
            <label className="flex items-center gap-2">
              <input type="checkbox" /> English
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" /> Hindi
            </label>
          </div>
        </div>
      </div>
    </aside>
  );
}
