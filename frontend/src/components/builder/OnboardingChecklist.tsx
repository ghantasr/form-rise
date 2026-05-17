import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react';

const DISMISSED_KEY = 'fr_checklist_dismissed';

interface ChecklistItem {
  id: string;
  label: string;
  hint: string;
  done: boolean;
}

interface OnboardingChecklistProps {
  hasFields: boolean;
  hasRequiredField: boolean;
  hasPreviewed: boolean;
  isPublished: boolean;
  onStartTour: () => void;
}

export function OnboardingChecklist({ hasFields, hasRequiredField, hasPreviewed, isPublished, onStartTour }: OnboardingChecklistProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem(DISMISSED_KEY));

  if (dismissed) return null;

  const items: ChecklistItem[] = [
    { id: 'field',    label: 'Add your first field',         hint: 'Click a field type in the left panel',         done: hasFields },
    { id: 'required', label: 'Mark a field as required',     hint: 'Toggle "Required" in the field editor',        done: hasRequiredField },
    { id: 'preview',  label: 'Preview your form',            hint: 'Click the Preview button in the top bar',      done: hasPreviewed },
    { id: 'publish',  label: 'Publish & share',              hint: 'Click Publish — you\'ll get a link + QR code', done: isPublished },
  ];

  const doneCount  = items.filter((i) => i.done).length;
  const allDone    = doneCount === items.length;
  const pct        = Math.round((doneCount / items.length) * 100);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-40 w-[calc(100vw-2rem)] max-w-[256px] rounded-2xl shadow-xl overflow-hidden border border-[#E8E8E4] bg-white"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        style={{ backgroundColor: allDone ? '#E8F5EE' : '#1B6B4A' }}
        onClick={() => setCollapsed((c) => !c)}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ backgroundColor: allDone ? '#1B6B4A' : 'rgba(255,255,255,0.2)', color: allDone ? 'white' : 'white' }}
          >
            {doneCount}/{items.length}
          </div>
          <span className="text-sm font-semibold" style={{ color: allDone ? '#1B6B4A' : 'white' }}>
            {allDone ? '🎉 All set!' : 'Getting started'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* ChevronDown = collapsed (expand), ChevronUp = expanded (collapse) */}
          {collapsed
            ? <ChevronDown size={14} style={{ color: allDone ? '#1B6B4A' : 'white' }} />
            : <ChevronUp   size={14} style={{ color: allDone ? '#1B6B4A' : 'white' }} />
          }
          <button
            onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
            className="transition-colors cursor-pointer"
            style={{ color: allDone ? '#1B6B4A' : 'rgba(255,255,255,0.7)' }}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Progress bar */}
          <div className="h-1" style={{ backgroundColor: '#E8E8E4' }}>
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: '#1B6B4A' }}
            />
          </div>

          {/* Items */}
          <div className="flex flex-col divide-y divide-[#F0F0EC]">
            {items.map((item) => (
              <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                <div
                  className="w-5 h-5 rounded-full shrink-0 mt-0.5 flex items-center justify-center transition-colors"
                  style={{ backgroundColor: item.done ? '#1B6B4A' : '#F0F0EC', border: `2px solid ${item.done ? '#1B6B4A' : '#D0D0CA'}` }}
                >
                  {item.done && <Check size={10} color="white" strokeWidth={3} />}
                </div>
                <div>
                  <p className={`text-xs font-medium leading-snug ${item.done ? 'line-through text-[#9B9B96]' : 'text-[#1A1A18]'}`}>
                    {item.label}
                  </p>
                  {!item.done && (
                    <p className="text-[11px] text-[#6B6B66] leading-snug mt-0.5">{item.hint}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-[#F0F0EC] flex items-center justify-between">
            <button
              onClick={onStartTour}
              className="text-xs font-medium text-[#1B6B4A] hover:text-[#134F36] cursor-pointer transition-colors"
            >
              ↺ Replay tour
            </button>
            {allDone && (
              <button
                onClick={handleDismiss}
                className="text-xs font-medium text-[#6B6B66] hover:text-[#1A1A18] cursor-pointer transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
