import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { QrDisplay } from '../qr/QrDisplay';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  formTitle?: string;
}

export function PublishModal({ isOpen, onClose, slug, formTitle }: PublishModalProps) {
  const [copied, setCopied] = useState(false);
  const formUrl = `${window.location.origin}/f/${slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for environments without clipboard API
      const el = document.createElement('input');
      el.value = formUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Form Published" size="md">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2 p-3 bg-[#E8F5EE] rounded-lg">
          <div className="w-2 h-2 rounded-full bg-[#1B6B4A] flex-shrink-0" />
          <p className="text-sm text-[#1B6B4A] font-medium">Your form is now live and accepting responses.</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wider mb-2">Form URL</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 bg-[#FAFAF8] border border-[#E8E8E4] rounded-lg text-sm text-[#1A1A18] font-mono truncate">
              {formUrl}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              className="flex-shrink-0"
            >
              {copied ? <Check size={14} className="text-[#1B6B4A]" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wider mb-3">QR Code</p>
          <div className="flex justify-center">
            <QrDisplay url={formUrl} label={`form-${slug}`} size={160} formTitle={formTitle} />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => window.open(formUrl, '_blank')}
          >
            Open form
          </Button>
          <Button size="sm" className="flex-1" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
