import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

const TOUR_KEY = 'fr_tour_done';

interface Step {
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const STEPS: Step[] = [
  {
    target: 'field-picker',
    title: 'Step 1 — Add fields',
    description: 'Click any field type here to add it to your form canvas. Try "Short text" or "Picture choice" to start.',
    position: 'right',
  },
  {
    target: 'form-canvas',
    title: 'Step 2 — Your canvas',
    description: 'Fields you add appear here. Click a field to select it, drag the handle to reorder.',
    position: 'right',
  },
  {
    target: 'field-editor',
    title: 'Step 3 — Edit properties',
    description: 'With a field selected, customise its label, placeholder, options, and conditional logic here.',
    position: 'left',
  },
  {
    target: 'style-btn',
    title: 'Step 4 — Style your form',
    description: 'Choose from colour themes to match your brand. Changes save instantly.',
    position: 'bottom',
  },
  {
    target: 'preview-btn',
    title: 'Step 5 — Preview',
    description: 'See exactly how respondents will experience your form before going live.',
    position: 'bottom',
  },
  {
    target: 'publish-btn',
    title: 'Step 6 — Publish & share',
    description: 'Publish to get a shareable link and QR code. You can pause or unpublish anytime.',
    position: 'bottom',
  },
];

interface Rect { top: number; left: number; width: number; height: number; }

function getRect(target: string): Rect | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

const PAD = 10;
const TIP_W = 260;
const TIP_H = 180;

function tooltipStyle(rect: Rect, position: Step['position']): React.CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top: number;
  let left: number;

  switch (position) {
    case 'right': {
      const preferred = rect.left + rect.width + 16;
      left = preferred + TIP_W > vw - 8 ? rect.left - TIP_W - 16 : preferred;
      top = rect.top + rect.height / 2 - 60;
      break;
    }
    case 'left': {
      const preferred = rect.left - TIP_W - 16;
      left = preferred < 8 ? rect.left + rect.width + 16 : preferred;
      top = rect.top + rect.height / 2 - 60;
      break;
    }
    case 'bottom': {
      top = rect.top + rect.height + 12;
      const centered = rect.left + rect.width / 2 - TIP_W / 2;
      left = Math.min(Math.max(8, centered), vw - TIP_W - 8);
      break;
    }
    case 'top': {
      top = rect.top - TIP_H - 12;
      const centered = rect.left + rect.width / 2 - TIP_W / 2;
      left = Math.min(Math.max(8, centered), vw - TIP_W - 8);
      break;
    }
  }

  top = Math.max(8, Math.min(top, vh - TIP_H - 8));
  return { top, left, width: TIP_W };
}

interface GuidedTourProps {
  onDone: () => void;
}

export function GuidedTour({ onDone }: GuidedTourProps) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const stepRef = useRef(step);
  stepRef.current = step;

  // Prevents backdrop-dismiss from firing on the ~300ms delayed synthetic click
  // that mobile browsers emit after touchend — which can land on the backdrop
  // after the tooltip repositions itself on step change.
  const dismissLockRef = useRef(false);

  useEffect(() => {
    const el = document.querySelector(`[data-tour="${STEPS[step].target}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const t = setTimeout(() => setRect(getRect(STEPS[step].target)), 320);
      return () => clearTimeout(t);
    } else {
      setRect(null);
    }
  }, [step]);

  const finish = () => {
    localStorage.setItem(TOUR_KEY, '1');
    onDone();
  };

  const lockAndAdvance = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    // Lock backdrop dismiss for 700 ms — covers both the 300 ms mobile synthetic
    // click delay and the 320 ms rect-update timeout.
    dismissLockRef.current = true;
    setTimeout(() => { dismissLockRef.current = false; }, 700);
    const current = stepRef.current;
    if (current < STEPS.length - 1) setStep(current + 1);
    else finish();
  };

  const lockAndSkip = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    dismissLockRef.current = true;
    finish();
  };

  const handleBackdrop = (e: React.MouseEvent) => {
    if (dismissLockRef.current) return;
    if (e.target === e.currentTarget) finish();
  };

  const current = STEPS[step];
  const isCentered = !rect;

  const centeredStyle: React.CSSProperties = {
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: Math.min(TIP_W, window.innerWidth - 32),
    zIndex: 60,
  };

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ pointerEvents: 'all' }}
      onClick={handleBackdrop}
    >
      {/* SVG spotlight overlay */}
      {rect && (
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: 'none' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={rect.left - PAD} y={rect.top - PAD}
                width={rect.width + PAD * 2} height={rect.height + PAD * 2}
                rx="10" fill="black"
              />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#tour-mask)" />
          <rect
            x={rect.left - PAD} y={rect.top - PAD}
            width={rect.width + PAD * 2} height={rect.height + PAD * 2}
            rx="10" fill="none" stroke="#1B6B4A" strokeWidth="2" opacity="0.8"
          />
        </svg>
      )}
      {isCentered && (
        <div className="absolute inset-0 bg-black/50" style={{ pointerEvents: 'none' }} />
      )}

      {/* Tooltip */}
      <div
        className="absolute bg-white rounded-2xl shadow-2xl p-4"
        style={rect ? { ...tooltipStyle(rect, current.position), zIndex: 60 } : centeredStyle}
        onClick={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-sm font-bold text-[#1A1A18] leading-snug">{current.title}</p>
          <button
            onPointerDown={lockAndSkip}
            className="text-[#6B6B66] hover:text-[#1A1A18] cursor-pointer shrink-0 mt-0.5"
            style={{ touchAction: 'manipulation' }}
          >
            <X size={14} />
          </button>
        </div>
        <p className="text-xs text-[#6B6B66] leading-relaxed mb-4">{current.description}</p>

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-colors"
                style={{ backgroundColor: i === step ? '#1B6B4A' : '#E8E8E4' }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onPointerDown={lockAndSkip}
              className="text-xs text-[#6B6B66] hover:text-[#1A1A18] cursor-pointer transition-colors"
              style={{ touchAction: 'manipulation' }}
            >
              Skip
            </button>
            <button
              onPointerDown={lockAndAdvance}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white cursor-pointer transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1B6B4A', touchAction: 'manipulation' }}
            >
              {step === STEPS.length - 1 ? 'Done ✓' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function shouldShowTour(): boolean {
  return !localStorage.getItem(TOUR_KEY);
}
