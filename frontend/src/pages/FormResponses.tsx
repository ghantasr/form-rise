import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, ArrowLeft, BarChart2, Table } from 'lucide-react';
import { formsApi } from '../api/forms';
import { responsesApi } from '../api/responses';
import { Button } from '../components/shared/Button';
import { EmptyState } from '../components/shared/EmptyState';
import { PageLoader } from '../components/shared/LoadingSpinner';
import { useToast } from '../components/shared/Toast';
import { ResponseDetail } from '../components/responses/ResponseDetail';
import { ResponseChart } from '../components/responses/ResponseChart';
import type { Form } from '../types/form';
import type { FormResponse } from '../types/response';

type Tab = 'responses' | 'charts';

function truncate(str: string | undefined | null, max = 50): string {
  if (!str) return '—';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export function FormResponses() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [tab, setTab] = useState<Tab>('responses');
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([formsApi.get(id), responsesApi.list(id)])
      .then(([formRes, responsesRes]) => {
        setForm(formRes.data);
        setResponses(responsesRes.data);
      })
      .catch(() => toast('Failed to load responses', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleExportCsv = async () => {
    if (!id) return;
    setExporting(true);
    try {
      const { data } = await responsesApi.exportCsv(id);
      const url = URL.createObjectURL(data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${form?.title ?? 'responses'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast('Failed to export CSV', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteResponse = async (responseId: string) => {
    if (!id || !confirm('Delete this response?')) return;
    try {
      await responsesApi.delete(id, responseId);
      setResponses((prev) => prev.filter((r) => r.id !== responseId));
      if (selectedResponse?.id === responseId) setSelectedResponse(null);
      toast('Response deleted', 'success');
    } catch {
      toast('Failed to delete response', 'error');
    }
  };

  if (loading) return <PageLoader />;

  const fields = form?.fields ?? [];

  const getAnswerDisplay = (response: FormResponse, fieldId: string): string => {
    const answer = response.answers.find((a) => a.fieldId === fieldId);
    if (!answer) return '—';
    if (answer.valuesArray && answer.valuesArray.length > 0) return truncate(answer.valuesArray.join(', '));
    if (answer.numericValue !== undefined && answer.numericValue !== null) return String(answer.numericValue);
    return truncate(answer.value);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-[#6B6B66] hover:text-[#1A1A18] transition-colors cursor-pointer mt-1"
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-[#1A1A18] truncate">{form?.title}</h1>
          <p className="text-sm text-[#6B6B66] mt-0.5">
            {responses.length} response{responses.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExportCsv}
          isLoading={exporting}
          disabled={responses.length === 0}
          className="shrink-0"
        >
          <Download size={14} />
          <span className="hidden sm:inline">Export CSV</span>
          <span className="sm:hidden">CSV</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-[#E8E8E4]">
        {([
          { key: 'responses', label: 'Responses', icon: <Table size={14} /> },
          { key: 'charts', label: 'Charts', icon: <BarChart2 size={14} /> },
        ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer -mb-px ${
              tab === key
                ? 'border-[#1B6B4A] text-[#1B6B4A]'
                : 'border-transparent text-[#6B6B66] hover:text-[#1A1A18]'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'responses' && (
        responses.length === 0 ? (
          <EmptyState
            icon={<Table size={40} />}
            title="No responses yet"
            description="Share your form to start collecting responses."
          />
        ) : (
          <>
            {/* Mobile: card layout */}
            <div className="flex flex-col gap-3 md:hidden">
              {responses.map((response) => (
                <div
                  key={response.id}
                  onClick={() => setSelectedResponse(response)}
                  className={`bg-white border rounded-xl p-4 cursor-pointer transition-colors ${
                    selectedResponse?.id === response.id
                      ? 'border-[#1B6B4A] bg-[#E8F5EE]'
                      : 'border-[#E8E8E4] hover:border-[#1B6B4A]/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="text-xs text-[#6B6B66]">
                        {new Date(response.submittedAt).toLocaleString()}
                      </p>
                      {response.respondentEmail && (
                        <p className="text-sm font-medium text-[#1A1A18] mt-0.5 truncate">
                          {response.respondentEmail}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteResponse(response.id); }}
                      className="text-xs text-[#6B6B66] hover:text-red-500 transition-colors shrink-0 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {fields.slice(0, 3).map((f) => (
                      <div key={f.id} className="flex gap-2 text-xs">
                        <span className="text-[#6B6B66] shrink-0 w-24 truncate">{f.label}</span>
                        <span className="text-[#1A1A18] truncate">{getAnswerDisplay(response, f.id)}</span>
                      </div>
                    ))}
                    {fields.length > 3 && (
                      <p className="text-xs text-[#1B6B4A] mt-1">+{fields.length - 3} more — tap to view all</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table layout */}
            <div className="hidden md:block bg-white border border-[#E8E8E4] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E8E8E4] bg-[#FAFAF8]">
                      <th className="text-left px-4 py-3 font-semibold text-[#6B6B66] whitespace-nowrap">
                        Submitted at
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-[#6B6B66] whitespace-nowrap">
                        Email
                      </th>
                      {fields.map((f) => (
                        <th
                          key={f.id}
                          className="text-left px-4 py-3 font-semibold text-[#6B6B66] whitespace-nowrap max-w-[180px]"
                        >
                          {truncate(f.label, 30)}
                        </th>
                      ))}
                      <th className="w-16" />
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((response, i) => (
                      <tr
                        key={response.id}
                        onClick={() => setSelectedResponse(response)}
                        className={`border-b border-[#F0F0EC] cursor-pointer hover:bg-[#F5FAF7] transition-colors group ${
                          i % 2 === 0 ? '' : 'bg-[#FAFAF8]'
                        } ${selectedResponse?.id === response.id ? 'bg-[#E8F5EE]' : ''}`}
                      >
                        <td className="px-4 py-3 text-[#1A1A18] whitespace-nowrap">
                          {new Date(response.submittedAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-[#6B6B66] whitespace-nowrap">
                          {response.respondentEmail ?? '—'}
                        </td>
                        {fields.map((f) => (
                          <td key={f.id} className="px-4 py-3 text-[#1A1A18] max-w-[180px] truncate">
                            {getAnswerDisplay(response, f.id)}
                          </td>
                        ))}
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteResponse(response.id); }}
                            className="opacity-0 group-hover:opacity-100 text-xs text-[#6B6B66] hover:text-red-500 transition-all cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      )}

      {tab === 'charts' && (
        responses.length === 0 ? (
          <EmptyState
            icon={<BarChart2 size={40} />}
            title="No responses yet"
            description="Charts will appear here once responses are collected."
          />
        ) : (
          <ResponseChart fields={fields} responses={responses} />
        )
      )}

      {/* Response detail slide-out */}
      <ResponseDetail
        response={selectedResponse}
        onClose={() => setSelectedResponse(null)}
      />
    </div>
  );
}
