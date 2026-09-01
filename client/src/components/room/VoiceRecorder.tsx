import React, { useState, useRef, useEffect } from 'react';
import { Square, Trash2, Send, Radio } from 'lucide-react';

interface VoiceRecorderProps {
  onSendAudio: (blob: Blob, duration: number) => Promise<boolean>;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSendAudio, onCancel }) => {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  const startRecording = async () => {
    try {
      // High-grade acoustic echo cancellation & noise suppression to eliminate reverb
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1
        }
      });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(100);
      setRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied or error:', err);
      onCancel();
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleSend = async () => {
    if (!audioBlob || sending) return;
    setSending(true);
    await onSendAudio(audioBlob, duration);
    setSending(false);
    onCancel();
  };

  const formatSecs = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center justify-between w-full p-2 bg-red-50 dark:bg-red-950/40 rounded-full border border-red-200 dark:border-red-800/60 animate-fade-in gap-2">
      <div className="flex items-center gap-2 pl-2">
        <Radio className="w-4 h-4 text-apple-red animate-pulse" />
        <span className="text-footnote font-mono font-bold text-apple-red">
          {formatSecs(duration)}
        </span>
        {recording && (
          <span className="text-caption text-apple-red/80 italic hidden sm:inline">
            Recording voice note...
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {recording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="p-2 rounded-full bg-apple-red hover:bg-red-700 text-white transition-colors shadow-sm"
            title="Stop recording"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
          </button>
        ) : (
          audioUrl && (
            <audio src={audioUrl} controls className="h-7 max-w-[140px]" />
          )
        )}

        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-full bg-white dark:bg-[#1C1C1E] hover:bg-red-100 dark:hover:bg-red-900 text-apple-textSecondary transition-colors"
          title="Cancel"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={handleSend}
          disabled={recording || !audioBlob || sending}
          className="p-2 rounded-full bg-apple-blue hover:bg-apple-blueHover text-white transition-colors disabled:opacity-40 shadow-sm"
          title="Send voice note"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
