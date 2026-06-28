export default function QuickQuestions({ questions, loading, onSelect, locale }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-12 rounded-xl bg-ink-800/60 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4" role="list">
      {questions.map((q) => (
        <button
          key={q.id}
          type="button"
          role="listitem"
          onClick={() => onSelect(q)}
          className="min-h-[48px] text-left text-xs md:text-sm px-3 py-2.5 rounded-xl border border-ink-700 bg-ink-900/50 text-amber-100/90 hover:border-amber-500/40 hover:bg-amber-500/5 transition active:scale-[0.98]"
        >
          {q.question}
        </button>
      ))}
    </div>
  );
}
