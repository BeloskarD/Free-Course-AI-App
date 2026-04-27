"use client";

import { useState } from "react";
import SectionHeader from "../../components/ui/SectionHeader";
import CourseCard from "../../components/CourseCard";
import { aiSearch } from "../../services/ai";
import { Sparkles } from "lucide-react";

export default function AISearchClient() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const res = await aiSearch(query);
    setData(res.data);
    setLoading(false);
  };


  return (
    <div className="container section space-y-16">
      {/* Search Box */}
      <div className="max-w-3xl">
        <SectionHeader
          title="AI-Powered Course Search"
          subtitle="Describe your learning goal and let AI build your learning path."
        />

        <div className="mt-8 relative group max-w-2xl">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={4}
            className="w-full p-8 rounded-[2.5rem] bg-white dark:bg-neutral-900 border-2 border-neutral-100 dark:border-neutral-800 focus:border-blue-500/50 outline-none shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] transition-all text-lg font-bold resize-none text-[var(--site-text)] placeholder:text-neutral-400 dark:placeholder:text-neutral-600 mb-6"
            placeholder="Describe your mastery goal (e.g., 'Senior React Engineer Architecture')"
          />

          <button
            className="px-12 py-5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-black rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-xl border border-white/10"
            onClick={handleSearch}
          >
            <Sparkles size={18} className="text-blue-500" />
            Establish Neural Link
          </button>
        </div>
      </div>

      {loading && <p>AI is thinking…</p>}

      {/* RESULTS */}
      {data && (
        <>
          {/* Courses */}
          <section className="stack">
            <SectionHeader title="Recommended Courses" />
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {data.courses.map((course, i) => (
                <CourseCard key={i} course={course} />
              ))}
            </div>
          </section>

          {/* Roadmap */}
          <section className="stack">
            <SectionHeader title="Learning Roadmap" />
            <div className="card">
              <ol className="list-decimal pl-6 space-y-2">
                {data.roadmap.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          </section>

          {/* AI Tools */}
          <section className="stack">
            <SectionHeader title="AI Tools for This Goal" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.tools.map((tool, i) => (
                <div key={i} className="card card-hover">
                  <h3 className="font-semibold">{tool.name}</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-2">
                    {tool.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
