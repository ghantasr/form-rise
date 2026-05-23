import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, ArrowLeft, BarChart2, Table, TrendingDown } from 'lucide-react';
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
  const [analytics, setAnalytics] = useState<{
    viewCount: number;
    fieldDropoffs: Array<{ fieldId: string; reachCount: number }>;
  } | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([formsApi.get(id), responsesApi.list(id)])
      .then(([formRes, responsesRes]) => {
        setForm(formRes.data);
        setResponses(responsesRes.data);
      })
      .catch(() => toast('Failed to load responses', 'error'))
      .finally(() => setLoading(false));

    formsApi.getAnalytics(id)
      .then(({ data }) => setAnalytics(data))
      .catch(() => {/* analytics are optional */});
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
                      {form?.isQuizMode && response.totalScore !== undefined && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-sm font-medium text-[#1A1A18]">{response.totalScore}/{response.maxScore}</span>
                          {response.isPassed === true && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">Passed</span>}
                          {response.isPassed === false && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">Failed</span>}
                        </div>
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
                <table className="text-sm table-fixed" style={{ minWidth: `${160 + 176 + (form?.isQuizMode ? 180 : 0) + fields.length * 176 + 56}px` }}>
                  <colgroup>
                    <col style={{ width: 160 }} />
                    <col style={{ width: 176 }} />
                    {form?.isQuizMode && <col style={{ width: 90 }} />}
                    {form?.isQuizMode && <col style={{ width: 90 }} />}
                    {fields.map((f) => <col key={f.id} style={{ width: 176 }} />)}
                    <col style={{ width: 56 }} />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-[#E8E8E4] bg-[#FAFAF8]">
                      <th className="text-left px-4 py-3 font-semibold text-[#6B6B66] truncate">Submitted at</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#6B6B66] truncate">Email</th>
                      {form?.isQuizMode && <th className="text-left px-4 py-3 font-semibold text-[#6B6B66] truncate">Score</th>}
                      {form?.isQuizMode && <th className="text-left px-4 py-3 font-semibold text-[#6B6B66] truncate">Result</th>}
                      {fields.map((f) => (
                        <th key={f.id} className="text-left px-4 py-3 font-semibold text-[#6B6B66] truncate" title={f.label}>
                          {f.label}
                        </th>
                      ))}
                      <th />
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
                        <td className="px-4 py-3 text-[#1A1A18] truncate">{new Date(response.submittedAt).toLocaleString()}</td>
                        <td className="px-4 py-3 text-[#6B6B66] truncate">{response.respondentEmail ?? '—'}</td>
                        {form?.isQuizMode && (
                          <td className="px-4 py-3 text-[#1A1A18] font-medium">
                            {response.totalScore !== undefined ? `${response.totalScore}/${response.maxScore}` : '—'}
                          </td>
                        )}
                        {form?.isQuizMode && (
                          <td className="px-4 py-3">
                            {response.isPassed === true && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Passed</span>}
                            {response.isPassed === false && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Failed</span>}
                            {response.isPassed === undefined && '—'}
                          </td>
                        )}
                        {fields.map((f) => (
                          <td key={f.id} className="px-4 py-3 text-[#1A1A18] truncate" title={getAnswerDisplay(response, f.id)}>
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
          <>
            <ResponseChart fields={fields} responses={responses} />

            {/* Field reach funnel */}
            {analytics && analytics.viewCount > 0 && (
              <div className="mt-6 bg-white border border-[#E8E8E4] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown size={16} className="text-[#1B6B4A]" />
                  <h3 className="text-sm font-semibold text-[#1A1A18]">Field reach funnel</h3>
                  <span className="text-xs text-[#6B6B66] ml-auto">
                    {analytics.viewCount} total view{analytics.viewCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {fields.map((field) => {
                    const dropoff = analytics.fieldDropoffs.find(
                      (d) => d.fieldId === field.id
                    );
                    const reachCount = dropoff?.reachCount ?? 0;
                    const pct = analytics.viewCount > 0
                      ? Math.round((reachCount / analytics.viewCount) * 100)
                      : 0;
                    return (
                      <div key={field.id} className="flex items-center gap-3">
                        <span className="text-sm text-[#1A1A18] w-36 shrink-0 truncate" title={field.label}>
                          {field.label}
                        </span>
                        <div className="flex-1 h-5 bg-[#F0F0EC] rounded-full overflow-hidden relative">
                          <div
                            className="h-full bg-[#1B6B4A] rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-[#6B6B66] w-16 text-right shrink-0">
                          {reachCount} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
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
