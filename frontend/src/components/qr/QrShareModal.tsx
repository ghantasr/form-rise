import { useEffect, useState } from 'react';
import { Trash2, RefreshCw } from 'lucide-react';
import { qrApi, type QrDto } from '../../api/qr';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { QrDisplay } from './QrDisplay';
import { useToast } from '../shared/Toast';

interface QrShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  formId: string;
}

export function QrShareModal({ isOpen, onClose, formId }: QrShareModalProps) {
  const { toast } = useToast();

  const [qrCodes, setQrCodes] = useState<QrDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [count, setCount] = useState('1');
  const [labelPrefix, setLabelPrefix] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    qrApi
      .list(formId)
      .then(({ data }) => setQrCodes(data))
      .catch(() => toast('Failed to load QR codes', 'error'))
      .finally(() => setLoading(false));
  }, [isOpen, formId]);

  const handleGenerate = async () => {
    const n = Math.min(100, Math.max(1, Number(count) || 1));
    setGenerating(true);
    try {
      const { data } = await qrApi.generate(formId, n, labelPrefix.trim() || undefined);
      setQrCodes((prev) => [...data, ...prev]);
      if (data.length === 1) setExpandedId(data[0].id);
      toast(`Generated ${data.length} QR code${data.length !== 1 ? 's' : ''}`, 'success');
    } catch {
      toast('Failed to generate QR codes', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (qrId: string) => {
    if (!confirm('Delete this QR code?')) return;
    try {
      await qrApi.delete(formId, qrId);
      setQrCodes((prev) => prev.filter((q) => q.id !== qrId));
      if (expandedId === qrId) setExpandedId(null);
    } catch {
      toast('Failed to delete QR code', 'error');
    }
  };

  const statusColors: Record<string, string> = {
    active: 'bg-[#E8F5EE] text-[#1B6B4A]',
    used: 'bg-gray-100 text-gray-500',
    expired: 'bg-red-100 text-red-600',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QR Codes" size="lg">
      <div className="flex flex-col gap-6">
        {/* Generate section */}
        <div className="bg-[#FAFAF8] border border-[#E8E8E4] rounded-xl p-4">
          <p className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wider mb-3">Generate New</p>
          <div className="flex items-end gap-3">
            <div className="w-24">
              <Input
                label="Count"
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Input
                label="Label prefix (optional)"
                value={labelPrefix}
                onChange={(e) => setLabelPrefix(e.target.value)}
                placeholder="e.g. Table, Chair, Seat"
              />
            </div>
            <Button onClick={handleGenerate} isLoading={generating} className="flex-shrink-0">
              <RefreshCw size={14} />
              Generate
            </Button>
          </div>
          {labelPrefix && (
            <p className="text-xs text-[#9C9C96] mt-2">
              Will create: "{labelPrefix} 1", "{labelPrefix} 2", …
            </p>
          )}
        </div>

        {/* QR list */}
        <div className="flex flex-col gap-0 max-h-[420px] overflow-y-auto">
          {loading && (
            <p className="text-sm text-[#9C9C96] text-center py-8">Loading…</p>
          )}
          {!loading && qrCodes.length === 0 && (
            <p className="text-sm text-[#9C9C96] text-center py-8">No QR codes yet. Generate one above.</p>
          )}
          {!loading && qrCodes.map((qr) => (
            <div key={qr.id} className="border-b border-[#F0F0EC] last:border-0">
              <div
                className="flex items-center gap-3 py-3 px-1 cursor-pointer hover:bg-[#FAFAF8] rounded-lg transition-colors"
                onClick={() => setExpandedId(expandedId === qr.id ? null : qr.id)}
              >
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${statusColors[qr.status] ?? ''}`}>
                  {qr.status}
                </span>
                <span className="flex-1 text-sm text-[#1A1A18] truncate">
                  {qr.label ?? <span className="text-[#9C9C96] font-mono text-xs">{qr.token.slice(0, 16)}…</span>}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(qr.id); }}
                  className="text-[#9C9C96] hover:text-red-500 transition-colors cursor-pointer flex-shrink-0 p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {expandedId === qr.id && (
                <div className="pb-4 pt-1 flex justify-center">
                  <QrDisplay url={qr.url} label={qr.label ?? qr.token.slice(0, 12)} size={180} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
