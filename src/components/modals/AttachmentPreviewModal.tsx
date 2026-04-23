import React from 'react';
import { X } from 'lucide-react';

type PreviewFile = {
  name: string;
  type?: string;
  data?: string;
};

interface AttachmentPreviewModalProps {
  file: PreviewFile | null;
  onClose: () => void;
}

const AttachmentPreviewModal: React.FC<AttachmentPreviewModalProps> = ({ file, onClose }) => {
  if (!file) return null;

  const fileType = file.type || '';
  const isImage = fileType.includes('image');
  const isPdf = fileType.includes('pdf') || (file.data?.startsWith('data:application/pdf') ?? false);

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="min-w-0">
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wide">Attachment Preview</p>
            <p className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">{file.name}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Close preview">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 bg-slate-50 dark:bg-slate-950 p-4 overflow-auto">
          {isImage && file.data ? (
            <img src={file.data} alt={file.name} className="max-w-full max-h-[70vh] mx-auto rounded-lg border border-slate-200 dark:border-slate-700" />
          ) : isPdf && file.data ? (
            <iframe src={file.data} title={file.name} className="w-full h-[70vh] rounded-lg border border-slate-200 dark:border-slate-700 bg-white" />
          ) : (
            <div className="h-[50vh] flex flex-col items-center justify-center text-center px-6">
              <p className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">Preview not available</p>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-2">This file type cannot be previewed inline.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttachmentPreviewModal;

