import React, { useMemo } from 'react';
import { generatePromptPayPayload, generateQRCodeSVG } from '../utils/qrCode';

interface PromptPayQRCodeProps {
  promptPayId: string;
  amount: number;
  size?: number;
  className?: string;
}

export const PromptPayQRCode: React.FC<PromptPayQRCodeProps> = ({
  promptPayId,
  amount,
  size = 64,
  className = '',
}) => {
  const svgContent = useMemo(() => {
    try {
      const payload = generatePromptPayPayload(promptPayId, amount);
      return generateQRCodeSVG(payload, size);
    } catch (e) {
      console.error('Error generating PromptPay QR:', e);
      return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="100%" height="100%" fill="#f1f5f9"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="8" fill="#64748b">QR Code</text></svg>`;
    }
  }, [promptPayId, amount, size]);

  return (
    <div 
      className={`inline-block ${className}`}
      dangerouslySetInnerHTML={{ __html: svgContent }} 
    />
  );
};
