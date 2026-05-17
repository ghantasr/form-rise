import type { FieldType } from '../types/form';

export const FIELD_TYPES: Record<FieldType, { label: string; icon: string; hasOptions: boolean }> = {
  short_text:     { label: 'Short text',     icon: 'Type',        hasOptions: false },
  long_text:      { label: 'Long text',      icon: 'AlignLeft',   hasOptions: false },
  email:          { label: 'Email',          icon: 'Mail',        hasOptions: false },
  number:         { label: 'Number',         icon: 'Hash',        hasOptions: false },
  dropdown:       { label: 'Dropdown',       icon: 'ChevronDown', hasOptions: true  },
  radio:          { label: 'Single choice',  icon: 'Circle',      hasOptions: true  },
  checkbox:       { label: 'Multi choice',   icon: 'CheckSquare', hasOptions: true  },
  date:           { label: 'Date',           icon: 'Calendar',    hasOptions: false },
  rating:         { label: 'Rating',         icon: 'Star',        hasOptions: false },
  url:            { label: 'URL',            icon: 'Link',        hasOptions: false },
  phone:          { label: 'Phone number',   icon: 'Phone',       hasOptions: false },
  nps:            { label: 'NPS (0–10)',     icon: 'BarChart2',   hasOptions: false },
  picture_choice: { label: 'Picture choice', icon: 'Image',       hasOptions: true  },
};
