import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';
import { Button } from '../shared/Button';

interface QrDisplayProps {
  url: string;
  label?: string;
  size?: number;
  formTitle?: string;
}

export function QrDisplay({ url, label, size = 200, formTitle }: QrDisplayProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const handleDownload = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);

    // Title font size scales with QR size
    const titleFontSize = Math.max(14, Math.round(size / 12));
    const titleHeight = formTitle ? titleFontSize + 20 : 0;
    const padding = 24;
    const canvasWidth = size + padding * 2;
    const canvasHeight = size + padding * 2 + titleHeight;

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d')!;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw title if provided
    if (formTitle) {
      ctx.fillStyle = '#1A1A18';
      ctx.font = `bold ${titleFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      // Word-wrap the title if it's too long
      const maxWidth = canvasWidth - padding * 2;
      const words = formTitle.split(' ');
      let lines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);

      // If more than 2 lines, truncate
      if (lines.length > 2) {
        lines = lines.slice(0, 2);
        lines[1] = lines[1].slice(0, -3) + '...';
      }

      const lineHeight = titleFontSize + 4;
      const totalTextHeight = lines.length * lineHeight;
      const textStartY = (titleHeight - totalTextHeight) / 2;

      lines.forEach((line, i) => {
        ctx.fillText(line, canvasWidth / 2, textStartY + i * lineHeight);
      });
    }

    const img = new Image();
    img.onload = () => {
      const qrY = padding + titleHeight;
      ctx.drawImage(img, padding, qrY, size, size);
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
        {formTitle && (
          <p className="text-sm font-semibold text-[#1A1A18] text-center mb-3 pb-3 border-b border-[#E8E8E4]">
            {formTitle}
          </p>
        )}
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
