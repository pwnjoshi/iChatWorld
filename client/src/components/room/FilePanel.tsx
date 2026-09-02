import React, { useRef, useState } from 'react';
import { FileMetadata, TransferProgress, Member } from '../../types/index.js';
import { formatFileSize, formatTime } from '../../utils/format.js';
import { UploadCloud, Download, FileText, Image as ImageIcon, Film, Music, Archive, CheckCircle2, AlertCircle, Radio, Sparkles, Trash2, MessageSquare } from 'lucide-react';

interface FilePanelProps {
  files: FileMetadata[];
  currentMember: Member | null;
  transfers: Map<string, TransferProgress>;
  downloadedBlobs: Map<string, string>;
  onUploadFile: (file: File, isBroadcast?: boolean) => Promise<any>;
  onDownloadFile: (file: FileMetadata) => Promise<void>;
  onDeleteFile?: (fileId: string) => Promise<boolean>;
  onShareInChat?: (file: FileMetadata) => void;
}

export const FilePanel: React.FC<FilePanelProps> = ({
  files,
  currentMember,
  transfers,
  downloadedBlobs,
  onUploadFile,
  onDownloadFile,
  onDeleteFile,
  onShareInChat
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isHost = !!currentMember?.isCreator;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(Array.from(e.target.files));
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const processFiles = async (fileList: File[]) => {
    setUploading(true);
    for (const file of fileList) {
      try {
        await onUploadFile(file, false);
      } catch (e) {
        console.error('File upload failed:', e);
      }
    }
    setUploading(false);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-apple-blue" />;
    if (mimeType.startsWith('video/')) return <Film className="w-5 h-5 text-purple-500" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-5 h-5 text-amber-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-apple-red" />;
    if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('compressed')) {
      return <Archive className="w-5 h-5 text-emerald-600" />;
    }
    return <FileText className="w-5 h-5 text-apple-textSecondary" />;
  };

  const broadcastFiles = files.filter(f => f.isBroadcast);
  const normalFiles = files.filter(f => !f.isBroadcast);

  return (
    <div className="flex flex-col h-full bg-apple-bg dark:bg-black overflow-y-auto p-4 space-y-5 transition-colors">
      {/* Upload Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-ios-card p-5 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-apple-blue bg-blue-50/50 dark:bg-blue-950/20 scale-[1.01]'
            : 'border-apple-border dark:border-white/10 hover:border-apple-blue/50 bg-white dark:bg-[#1C1C1E] shadow-sm'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-apple-secondaryBg dark:bg-white/10 flex items-center justify-center text-apple-blue">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <p className="text-footnote font-semibold text-apple-textPrimary dark:text-white">
              {uploading ? 'Sharing file with room...' : 'Tap or drop files to share'}
            </p>
            <p className="text-caption text-apple-textSecondary dark:text-white/60 mt-0.5">
              Images, PDFs, documents, audio (Direct P2P + Relay fallback)
            </p>
          </div>
        </div>
      </div>

      {/* Broadcast Files Section (if faculty shared broadcast files) */}
      {broadcastFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 px-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-caption font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400">
              Faculty Broadcasts
            </span>
          </div>
          <div className="space-y-2.5">
            {broadcastFiles.map(file => (
              <FileCard
                key={file.id}
                file={file}
                transfer={transfers.get(file.id)}
                downloadedBlobUrl={downloadedBlobs.get(file.id)}
                isOwn={file.senderId === currentMember?.socketId}
                canDelete={file.senderId === currentMember?.socketId || isHost}
                onDownload={() => onDownloadFile(file)}
                onDelete={onDeleteFile ? () => onDeleteFile(file.id) : undefined}
                onShareInChat={onShareInChat ? () => onShareInChat(file) : undefined}
                getFileIcon={getFileIcon}
                isBroadcast
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Files Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-caption font-semibold uppercase tracking-wider text-apple-textSecondary dark:text-white/60">
            Shared Files ({files.length})
          </span>
        </div>

        {normalFiles.length === 0 && broadcastFiles.length === 0 ? (
          <div className="text-center py-8 text-apple-textSecondary dark:text-white/40">
            <p className="text-footnote font-medium">No files shared yet</p>
            <p className="text-caption mt-0.5">
              Drop files above to transfer instantly to everyone in the room.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {normalFiles.map(file => (
              <FileCard
                key={file.id}
                file={file}
                transfer={transfers.get(file.id)}
                downloadedBlobUrl={downloadedBlobs.get(file.id)}
                isOwn={file.senderId === currentMember?.socketId}
                canDelete={file.senderId === currentMember?.socketId || isHost}
                onDownload={() => onDownloadFile(file)}
                onDelete={onDeleteFile ? () => onDeleteFile(file.id) : undefined}
                onShareInChat={onShareInChat ? () => onShareInChat(file) : undefined}
                getFileIcon={getFileIcon}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface FileCardProps {
  file: FileMetadata;
  transfer?: TransferProgress;
  downloadedBlobUrl?: string;
  isOwn: boolean;
  canDelete: boolean;
  onDownload: () => void;
  onDelete?: () => void;
  onShareInChat?: () => void;
  getFileIcon: (mime: string) => React.ReactNode;
  isBroadcast?: boolean;
}

const FileCard: React.FC<FileCardProps> = ({
  file,
  transfer,
  downloadedBlobUrl,
  isOwn,
  canDelete,
  onDownload,
  onDelete,
  onShareInChat,
  getFileIcon,
  isBroadcast
}) => {
  const isImage = file.mimeType.startsWith('image/');
  const isPdf = file.mimeType.includes('pdf');
  const previewUrl = downloadedBlobUrl || (isOwn ? file.blobUrl : undefined);

  const handleDelete = () => {
    if (onDelete && window.confirm(`Remove "${file.filename}" from room files?`)) {
      onDelete();
    }
  };

  return (
    <div
      className={`p-3.5 rounded-ios-card bg-white dark:bg-[#1C1C1E] border transition-all shadow-sm ${
        isBroadcast ? 'border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/20' : 'border-apple-border/70 dark:border-white/10'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* File Icon & Info */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="p-2.5 rounded-xl bg-apple-secondaryBg dark:bg-white/10 shrink-0">
            {getFileIcon(file.mimeType)}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-subhead font-semibold text-apple-textPrimary dark:text-white truncate" title={file.filename}>
              {file.filename}
            </h4>
            <div className="flex flex-wrap items-center gap-2 text-caption text-apple-textSecondary dark:text-white/60 mt-0.5">
              <span>{formatFileSize(file.size)}</span>
              <span>•</span>
              <span>{file.senderName} {isOwn ? '(You)' : ''}</span>
              <span>•</span>
              <span>{formatTime(file.timestamp)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Share in Chat, Delete & Download */}
        <div className="shrink-0 flex items-center gap-1.5">
          {onShareInChat && (
            <button
              onClick={onShareInChat}
              className="p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-950/40 text-apple-blue transition-colors"
              title="Share in Chat"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          )}

          {canDelete && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 text-apple-textSecondary hover:text-apple-red transition-colors"
              title="Remove File"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onDownload}
            disabled={transfer?.status === 'transferring'}
            className="p-2.5 rounded-full bg-apple-secondaryBg dark:bg-white/10 hover:bg-apple-tertiaryBg text-apple-blue hover:text-apple-blueHover transition-colors disabled:opacity-50"
            title="Download File"
          >
            {downloadedBlobUrl ? (
              <CheckCircle2 className="w-4 h-4 text-apple-green" />
            ) : transfer?.status === 'transferring' ? (
              <Radio className="w-4 h-4 text-apple-blue animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar (during transfer) */}
      {transfer && transfer.status === 'transferring' && (
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-caption text-apple-textSecondary font-medium">
            <span>Transferring...</span>
            <span>{transfer.progress}%</span>
          </div>
          <div className="w-full bg-apple-secondaryBg h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-apple-blue h-full transition-all duration-200"
              style={{ width: `${transfer.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Image / PDF Inline Preview if downloaded or own file */}
      {previewUrl && isImage && (
        <div className="mt-3 pt-2 border-t border-apple-border/40 dark:border-white/10">
          <img
            src={previewUrl}
            alt={file.filename}
            className="max-h-56 rounded-xl object-contain mx-auto bg-black/5 dark:bg-white/5"
          />
        </div>
      )}
    </div>
  );
};
