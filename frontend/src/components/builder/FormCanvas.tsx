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
import { MousePointerClick } from 'lucide-react';
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
      <div className="max-w-2xl mx-auto px-6 py-8">
        {fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <div className="w-16 h-16 bg-[#E8F5EE] rounded-full flex items-center justify-center mb-4">
              <MousePointerClick size={28} className="text-[#1B6B4A]" />
            </div>
            <h3 className="text-base font-semibold text-[#1A1A18] mb-2">No fields yet</h3>
            <p className="text-sm text-[#6B6B66] max-w-xs">
              Drag fields here or click a field type on the left to add it to your form.
            </p>
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
