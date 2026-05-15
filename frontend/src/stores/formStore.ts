import { create } from 'zustand';
import type { Form, FormField, FieldType } from '../types/form';

interface FormBuilderState {
  form: Partial<Form> | null;
  fields: FormField[];
  selectedFieldId: string | null;
  isDirty: boolean;
  isSaving: boolean;

  setForm: (form: Form) => void;
  setTitle: (title: string) => void;
  addField: (type: FieldType) => void;
  removeField: (id: string) => void;
  updateField: (id: string, updates: Partial<FormField>) => void;
  reorderFields: (oldIndex: number, newIndex: number) => void;
  selectField: (id: string | null) => void;
  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;
  reset: () => void;
}

export const useFormStore = create<FormBuilderState>((set, get) => ({
  form: null,
  fields: [],
  selectedFieldId: null,
  isDirty: false,
  isSaving: false,

  setForm: (form) => set({ form, fields: form.fields ?? [], isDirty: false }),

  setTitle: (title) => set((s) => ({ form: { ...s.form, title }, isDirty: true })),

  addField: (type) => {
    const newField: FormField = {
      id: crypto.randomUUID(),
      fieldType: type,
      label: `New ${type.replace('_', ' ')} field`,
      isRequired: false,
      sortOrder: get().fields.length,
      options: ['dropdown', 'radio', 'checkbox'].includes(type) ? ['Option 1', 'Option 2'] : undefined,
    };
    set((s) => ({
      fields: [...s.fields, newField],
      selectedFieldId: newField.id,
      isDirty: true,
    }));
  },

  removeField: (id) =>
    set((s) => ({
      fields: s.fields.filter((f) => f.id !== id),
      selectedFieldId: s.selectedFieldId === id ? null : s.selectedFieldId,
      isDirty: true,
    })),

  updateField: (id, updates) =>
    set((s) => ({
      fields: s.fields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
      isDirty: true,
    })),

  reorderFields: (oldIndex, newIndex) =>
    set((s) => {
      const fields = [...s.fields];
      const [moved] = fields.splice(oldIndex, 1);
      fields.splice(newIndex, 0, moved);
      return { fields: fields.map((f, i) => ({ ...f, sortOrder: i })), isDirty: true };
    }),

  selectField: (id) => set({ selectedFieldId: id }),
  setDirty: (isDirty) => set({ isDirty }),
  setSaving: (isSaving) => set({ isSaving }),
  reset: () => set({ form: null, fields: [], selectedFieldId: null, isDirty: false }),
}));
