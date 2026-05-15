import { X } from 'lucide-react';
import type { FormResponse } from '../../types/response';

interface ResponseDetailProps {
  response: FormResponse | null;
  onClose: () => void;
}

export function ResponseDetail({ response, onClose }: ResponseDetailProps) {
  if (!response) return null;

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E8E4] flex-shrink-0">
          <div>
            <p className="text-sm font-semibold text-[#1A1A18]">Response detail</p>
            <p className="text-xs text-[#9C9C96] mt-0.5">
              {new Date(response.submittedAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#9C9C96] hover:text-[#1A1A18] transition-colors cursor-pointer p-1 rounded"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
          {response.respondentEmail && (
            <div>
              <p className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wider mb-1">Email</p>
              <p className="text-sm text-[#1A1A18]">{response.respondentEmail}</p>
            </div>
          )}

          {response.answers.map((answer) => {
            const displayValue =
              answer.valuesArray && answer.valuesArray.length > 0
                ? answer.valuesArray.join(', ')
                : answer.numericValue !== undefined && answer.numericValue !== null
                ? String(answer.numericValue)
                : answer.value || '—';

            return (
              <div key={answer.fieldId}>
                <p className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wider mb-1">
                  {answer.fieldLabel ?? 'Unknown field'}
                </p>
                <p className="text-sm text-[#1A1A18] whitespace-pre-wrap break-words">
                  {displayValue}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
