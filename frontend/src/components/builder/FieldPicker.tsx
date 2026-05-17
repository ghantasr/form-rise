import { Type, AlignLeft, Mail, Hash, ChevronDown, Circle, CheckSquare, Calendar, Star, Link, Phone, BarChart2, Image } from 'lucide-react';
import { FIELD_TYPES } from '../../utils/fieldTypes';
import type { FieldType } from '../../types/form';

const iconMap: Record<string, React.ReactNode> = {
  Type: <Type size={16} />,
  AlignLeft: <AlignLeft size={16} />,
  Mail: <Mail size={16} />,
  Hash: <Hash size={16} />,
  ChevronDown: <ChevronDown size={16} />,
  Circle: <Circle size={16} />,
  CheckSquare: <CheckSquare size={16} />,
  Calendar: <Calendar size={16} />,
  Star: <Star size={16} />,
  Link: <Link size={16} />,
  Phone: <Phone size={16} />,
  BarChart2: <BarChart2 size={16} />,
  Image: <Image size={16} />,
};

interface FieldPickerProps {
  onAdd: (type: FieldType) => void;
}

export function FieldPicker({ onAdd }: FieldPickerProps) {
  return (
    <div className="w-full lg:w-56 bg-white border-r border-[#E8E8E4] flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-[#E8E8E4]">
        <p className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wider">Field Types</p>
      </div>
      <div className="flex-1 py-2">
        {(Object.entries(FIELD_TYPES) as [FieldType, { label: string; icon: string; hasOptions: boolean }][]).map(
          ([type, config]) => (
            <button
              key={type}
              onClick={() => onAdd(type)}
              className="w-full flex items-center gap-3 px-4 py-3 lg:py-2.5 text-left text-sm text-[#1A1A18] hover:bg-[#E8F5EE] hover:text-[#1B6B4A] transition-colors cursor-pointer group"
            >
              <span className="text-[#6B6B66] group-hover:text-[#1B6B4A] transition-colors flex-shrink-0">
                {iconMap[config.icon]}
              </span>
              <span className="font-medium">{config.label}</span>
            </button>
          )
        )}
      </div>
    </div>
  );
}
