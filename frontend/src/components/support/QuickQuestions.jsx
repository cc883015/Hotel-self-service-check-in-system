export default function QuickQuestions({ questions, loading, onSelect }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <div key={i} className="faq-chip faq-chip-skeleton animate-pulse" />
        ))}
      </div>
    );
  }

  if (!questions.length) {
    return (
      <p className="text-sm text-stone-500 mb-4">No quick questions available right now.</p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4" role="list">
      {questions.map((q) => (
        <button
          key={q.id}
          type="button"
          role="listitem"
          onClick={() => onSelect(q)}
          className="faq-chip"
        >
          {q.question}
        </button>
      ))}
    </div>
  );
}
