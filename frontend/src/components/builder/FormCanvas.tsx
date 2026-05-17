import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FormField } from '../../types/form';
import { FieldCard } from './FieldCard';

interface SortableFieldProps {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function SortableField({ field, isSelected, onSelect, onDelete }: SortableFieldProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <FieldCard
        field={field}
        isSelected={isSelected}
        onSelect={onSelect}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

interface FormCanvasProps {
  fields: FormField[];
  selectedFieldId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
}

export function FormCanvas({ fields, selectedFieldId, onSelect, onDelete, onReorder }: FormCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(oldIndex, newIndex);
    }
  };

  return (
    <div className="flex-1 bg-[#FAFAF8] overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[28rem] text-center gap-8 py-10">
            <div>
              <h3 className="text-lg font-bold text-[#1A1A18] mb-1">Build your form in 3 steps</h3>
              <p className="text-sm text-[#6B6B66]">Follow the steps below to create and share your first form</p>
            </div>

            <div className="flex flex-col gap-4 w-full max-w-xs text-left">
              {/* Step 1 */}
              <div className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-[#E8E8E4] shadow-sm">
                <div className="w-8 h-8 rounded-full bg-[#1B6B4A] flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-white">1</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A1A18]">Pick a field type</p>
                  <p className="text-xs text-[#6B6B66] mt-0.5">Click any field in the <span className="font-medium text-[#1B6B4A]">left panel</span> — Short text, Dropdown, Rating and more.</p>
                </div>
                <div className="ml-auto text-[#1B6B4A] self-center shrink-0 hidden sm:block">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M15 10H5M9 6l-4 4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-[#E8E8E4] shadow-sm">
                <div className="w-8 h-8 rounded-full bg-[#1B6B4A] flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-white">2</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A1A18]">Customise each field</p>
                  <p className="text-xs text-[#6B6B66] mt-0.5">Click a field to edit its label, options, and conditions in the <span className="font-medium text-[#1B6B4A]">right panel</span>.</p>
                </div>
                <div className="ml-auto text-[#1B6B4A] self-center shrink-0 hidden sm:block">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M5 10h10M11 6l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-[#E8E8E4] shadow-sm">
                <div className="w-8 h-8 rounded-full bg-[#1B6B4A] flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-white">3</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A1A18]">Preview &amp; Publish</p>
                  <p className="text-xs text-[#6B6B66] mt-0.5">Use the <span className="font-medium text-[#1B6B4A]">top bar</span> to preview your form and share it with a link or QR code.</p>
                </div>
                <div className="ml-auto text-[#1B6B4A] self-center shrink-0 hidden sm:block">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 5v10M6 9l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-3">
                {fields.map((field) => (
                  <SortableField
                    key={field.id}
                    field={field}
                    isSelected={selectedFieldId === field.id}
                    onSelect={() => onSelect(field.id)}
                    onDelete={() => onDelete(field.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
