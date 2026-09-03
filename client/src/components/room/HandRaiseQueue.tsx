import React from 'react';
import { HandRaise } from '../../types/index.js';
import { Modal } from '../common/Modal.js';
import { formatTime } from '../../utils/format.js';
import { Avatar } from '../common/Avatar.js';
import { Hand, Check, XSquare } from 'lucide-react';

interface HandRaiseModalProps {
  isOpen: boolean;
  onClose: () => void;
  handsRaised: HandRaise[];
  onLowerHand: (targetSocketId?: string) => Promise<boolean>;
  onLowerAllHands: () => Promise<boolean>;
  isHost?: boolean;
}

export const HandRaiseModal: React.FC<HandRaiseModalProps> = ({
  isOpen,
  onClose,
  handsRaised,
  onLowerHand,
  onLowerAllHands,
  isHost
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Raised Hands Queue">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-apple-border/50">
          <div className="flex items-center gap-2">
            <Hand className="w-4 h-4 text-amber-500" />
            <span className="text-footnote font-semibold text-apple-textPrimary">
              {handsRaised.length} {handsRaised.length === 1 ? 'person waiting' : 'people waiting'}
            </span>
          </div>

          {isHost && handsRaised.length > 0 && (
            <button
              onClick={onLowerAllHands}
              className="text-caption font-semibold text-apple-red hover:text-red-700 transition-colors flex items-center gap-1"
            >
              <XSquare className="w-3.5 h-3.5" />
              <span>Lower All</span>
            </button>
          )}
        </div>

        {handsRaised.length === 0 ? (
          <div className="text-center py-6 text-apple-textSecondary space-y-1">
            <p className="text-footnote font-medium text-apple-textPrimary">No hands raised</p>
            <p className="text-caption">Participants who raise their hand will appear here in chronological order.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {handsRaised.map((hand, idx) => (
              <div
                key={hand.socketId}
                className="p-2.5 rounded-ios-card bg-apple-secondaryBg/70 border border-apple-border/40 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 text-center text-caption font-bold text-apple-textSecondary">
                    #{idx + 1}
                  </span>
                  <Avatar name={hand.displayName} size="sm" />
                  <div className="min-w-0">
                    <p className="text-footnote font-semibold text-apple-textPrimary truncate">
                      {hand.displayName}
                    </p>
                    <p className="text-[11px] text-apple-textSecondary">
                      Raised at {formatTime(hand.raisedAt)}
                    </p>
                  </div>
                </div>

                {isHost && (
                  <button
                    onClick={() => onLowerHand(hand.socketId)}
                    className="p-2 rounded-full bg-white hover:bg-apple-green hover:text-white text-apple-green border border-apple-border shadow-sm transition-colors text-caption font-medium flex items-center gap-1 shrink-0"
                    title="Acknowledge participant"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Acknowledge</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
