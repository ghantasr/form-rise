import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { FormField } from '../../types/form';
import type { FormResponse } from '../../types/response';

interface ResponseChartProps {
  fields: FormField[];
  responses: FormResponse[];
}

const GREEN = '#1B6B4A';
const GREEN_LIGHT = '#E8F5EE';

function ChoiceChart({ field, responses }: { field: FormField; responses: FormResponse[] }) {
  const counts: Record<string, number> = {};
  for (const opt of field.options ?? []) counts[opt] = 0;

  for (const r of responses) {
    const answer = r.answers.find((a) => a.fieldId === field.id);
    if (!answer) continue;
    if (answer.valuesArray?.length) {
      for (const v of answer.valuesArray) {
        if (v in counts) counts[v]++;
      }
    } else if (answer.value && answer.value in counts) {
      counts[answer.value]++;
    }
  }

  const data = Object.entries(counts).map(([name, value]) => ({ name, value }));
  const total = responses.filter((r) => r.answers.some((a) => a.fieldId === field.id && (a.value || a.valuesArray?.length))).length;

  return (
    <div className="bg-white border border-[#E8E8E4] rounded-xl p-5">
      <p className="text-sm font-semibold text-[#1A1A18] mb-1">{field.label}</p>
      <p className="text-xs text-[#9C9C96] mb-4">{total} response{total !== 1 ? 's' : ''}</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barCategoryGap="30%">
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B6B66' }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6B6B66' }} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            contentStyle={{ border: `1px solid #E8E8E4`, borderRadius: 8, fontSize: 12 }}
            cursor={{ fill: GREEN_LIGHT }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={GREEN} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RatingChart({ field, responses }: { field: FormField; responses: FormResponse[] }) {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  let count = 0;

  for (const r of responses) {
    const answer = r.answers.find((a) => a.fieldId === field.id);
    if (!answer || answer.numericValue === undefined || answer.numericValue === null) continue;
    const star = Math.round(answer.numericValue);
    if (star >= 1 && star <= 5) {
      counts[star]++;
      sum += star;
      count++;
    }
  }

  const avg = count > 0 ? (sum / count).toFixed(1) : '—';
  const data = [1, 2, 3, 4, 5].map((star) => ({ name: `${star}★`, value: counts[star] }));

  return (
    <div className="bg-white border border-[#E8E8E4] rounded-xl p-5">
      <p className="text-sm font-semibold text-[#1A1A18] mb-1">{field.label}</p>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-2xl font-bold text-[#1B6B4A]">{avg}</span>
        <span className="text-xs text-[#9C9C96]">avg · {count} response{count !== 1 ? 's' : ''}</span>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} barCategoryGap="30%">
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B6B66' }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6B6B66' }} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            contentStyle={{ border: `1px solid #E8E8E4`, borderRadius: 8, fontSize: 12 }}
            cursor={{ fill: GREEN_LIGHT }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={GREEN} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function NumberStats({ field, responses }: { field: FormField; responses: FormResponse[] }) {
  const nums: number[] = [];
  for (const r of responses) {
    const answer = r.answers.find((a) => a.fieldId === field.id);
    const v = answer?.numericValue ?? (answer?.value ? Number(answer.value) : NaN);
    if (!isNaN(v)) nums.push(v);
  }

  if (nums.length === 0) {
    return (
      <div className="bg-white border border-[#E8E8E4] rounded-xl p-5">
        <p className="text-sm font-semibold text-[#1A1A18] mb-1">{field.label}</p>
        <p className="text-xs text-[#9C9C96]">No responses yet</p>
      </div>
    );
  }

  const sorted = [...nums].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2)
    : String(sorted[mid]);

  return (
    <div className="bg-white border border-[#E8E8E4] rounded-xl p-5">
      <p className="text-sm font-semibold text-[#1A1A18] mb-1">{field.label}</p>
      <p className="text-xs text-[#9C9C96] mb-4">{nums.length} response{nums.length !== 1 ? 's' : ''}</p>
      <div className="grid grid-cols-4 gap-3">
        {[['Min', min], ['Max', max], ['Avg', avg], ['Median', median]].map(([label, val]) => (
          <div key={label} className="bg-[#FAFAF8] rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-[#1B6B4A]">{val}</p>
            <p className="text-xs text-[#9C9C96] mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResponseChart({ fields, responses }: ResponseChartProps) {
  const chartableFields = fields.filter((f) =>
    ['dropdown', 'radio', 'checkbox', 'rating', 'number'].includes(f.fieldType)
  );

  if (chartableFields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-[#9C9C96]">
        <p className="text-sm">No chartable fields in this form.</p>
        <p className="text-xs mt-1">Add dropdown, radio, checkbox, rating, or number fields to see charts.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {chartableFields.map((field) => {
        if (['dropdown', 'radio', 'checkbox'].includes(field.fieldType)) {
          return <ChoiceChart key={field.id} field={field} responses={responses} />;
        }
        if (field.fieldType === 'rating') {
          return <RatingChart key={field.id} field={field} responses={responses} />;
        }
        if (field.fieldType === 'number') {
          return <NumberStats key={field.id} field={field} responses={responses} />;
        }
        return null;
      })}
    </div>
  );
}
