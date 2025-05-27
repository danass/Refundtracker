// Simple component to display notes with a title.
export default function NoteDisplayItem({ title, notes }) {
  let displayNotes = notes;
  if (notes === null || typeof notes === 'undefined' || String(notes).trim() === '') {
    displayNotes = <span className="italic text-slate-500">No {title ? title.toLowerCase().replace('current ', '') : 'notes'} provided.</span>;
  }

  return (
    <div className="my-4">
      {title && <h4 className="text-sm font-semibold text-slate-700 mb-1.5">{title}:</h4>}
      <div className="text-sm text-slate-800 bg-slate-50 p-3 rounded-md border border-slate-200 min-h-[60px] whitespace-pre-wrap leading-relaxed">
        {displayNotes}
      </div>
    </div>
  );
} 