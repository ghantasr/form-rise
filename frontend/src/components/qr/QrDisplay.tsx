import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';
import { Button } from '../shared/Button';

interface QrDisplayProps {
  url: string;
  label?: string;
  size?: number;
}

export function QrDisplay({ url, label, size = 200 }: QrDisplayProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const handleDownload = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    const padding = 24;
    canvas.width = size + padding * 2;
    canvas.height = size + padding * 2;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, padding, padding, size, size);
      const link = document.createElement('a');
      link.download = `${label ?? 'qr-code'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="p-4 bg-white border border-[#E8E8E4] rounded-xl">
        <QRCodeSVG
          ref={svgRef}
          value={url}
          size={size}
          level="M"
          fgColor="#1A1A18"
          bgColor="#ffffff"
        />
      </div>
      {label && <p className="text-xs text-[#6B6B66] font-medium">{label}</p>}
      <Button variant="secondary" size="sm" onClick={handleDownload}>
        <Download size={14} />
        Download PNG
      </Button>
    </div>
  );
}
