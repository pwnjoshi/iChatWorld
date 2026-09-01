import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Modal } from '../common/Modal.js';
import { Copy, Check, Share2, Maximize2, Minimize2 } from 'lucide-react';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
}

export const QRModal: React.FC<QRModalProps> = ({ isOpen, onClose, roomCode }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isProjectorMode, setIsProjectorMode] = useState(false);

  const joinUrl = `${window.location.origin}/?code=${roomCode}`;

  useEffect(() => {
    if (!roomCode || !isOpen) return;

    QRCode.toDataURL(joinUrl, {
      width: isProjectorMode ? 600 : 320,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('[QR] Error generating QR code:', err));
  }, [joinUrl, isOpen, isProjectorMode, roomCode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy link', e);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join iChatWorld Room ${roomCode}`,
          text: `Join real-time classroom room ${roomCode} on iChatWorld`,
          url: joinUrl
        });
      } catch (e) {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setIsProjectorMode(false);
        onClose();
      }}
      title={isProjectorMode ? '' : `Scan to Join Room`}
      maxWidth={isProjectorMode ? 'max-w-2xl' : 'max-w-md'}
    >
      <div className="flex flex-col items-center text-center space-y-5">
        {/* Room Code Header in Modal */}
        <div className="space-y-1">
          <p className="text-caption font-semibold uppercase tracking-wider text-apple-textSecondary">
            Room Code
          </p>
          <div className="font-mono text-title-2 font-bold text-apple-textPrimary tracking-widest bg-apple-secondaryBg px-4 py-1.5 rounded-ios-btn inline-block">
            {roomCode}
          </div>
        </div>

        {/* QR Code Display Container */}
        <div className="p-4 bg-white rounded-2xl border border-apple-border shadow-sm flex items-center justify-center">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR Code for room ${roomCode}`}
              className={`rounded-xl transition-all duration-300 ${
                isProjectorMode ? 'w-80 h-80 md:w-96 md:h-96' : 'w-56 h-56'
              }`}
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-apple-textSecondary">
              Generating QR...
            </div>
          )}
        </div>

        <p className="text-footnote text-apple-textSecondary max-w-xs">
          Scan with iOS Camera or Android to instantly enter this room with zero login.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 w-full pt-2">
          <button
            onClick={handleCopy}
            className="flex-1 min-w-[130px] py-2.5 px-4 rounded-full bg-apple-secondaryBg hover:bg-apple-tertiaryBg text-apple-textPrimary font-medium text-subhead transition-colors flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-apple-green" /> : <Copy className="w-4 h-4 text-apple-textSecondary" />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex-1 min-w-[130px] py-2.5 px-4 rounded-full bg-apple-blue hover:bg-apple-blueHover text-white font-medium text-subhead transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>

          <button
            onClick={() => setIsProjectorMode(!isProjectorMode)}
            title={isProjectorMode ? 'Exit Projector Mode' : 'Classroom Projector Mode'}
            className="p-2.5 rounded-full bg-apple-secondaryBg hover:bg-apple-tertiaryBg text-apple-textSecondary hover:text-apple-textPrimary transition-colors"
          >
            {isProjectorMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </Modal>
  );
};
