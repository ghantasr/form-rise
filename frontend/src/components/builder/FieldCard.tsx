import { GripVertical, Trash2 } from 'lucide-react';
import type { FormField } from '../../types/form';
import { FIELD_TYPES } from '../../utils/fieldTypes';

interface FieldCardProps {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  dragHandleProps?: Record<string, unknown>;
}

export function FieldCard({ field, isSelected, onSelect, onDelete, dragHandleProps }: FieldCardProps) {
  const typeConfig = FIELD_TYPES[field.fieldType];

  return (
    <div
      onClick={onSelect}
      className={`bg-white border rounded-lg p-4 cursor-pointer transition-all group ${
        isSelected
          ? 'ring-2 ring-[#1B6B4A] border-[#1B6B4A] shadow-sm'
          : 'border-[#E8E8E4] hover:border-[#1B6B4A] hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          {...dragHandleProps}
          className="mt-0.5 text-[#C8C8C4] hover:text-[#6B6B66] cursor-grab active:cursor-grabbing flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={16} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#E8F5EE] text-[#1B6B4A]">
              {typeConfig?.label ?? field.fieldType}
            </span>
            {field.isRequired && (
              <span className="text-red-500 text-sm font-bold" title="Required">
                *
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-[#1A1A18] truncate">
            {field.label || 'Untitled field'}
          </p>
          {field.helpText && (
            <p className="text-xs text-[#9C9C96] mt-0.5 truncate">{field.helpText}</p>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-[#9C9C96] hover:text-red-500 transition-all cursor-pointer p-0.5 rounded"
          title="Delete field"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
