
import React, { useEffect, useState } from 'react';
import type { Asset } from '../types/supabase';
import { Icon } from './ui/Icon';
import { FileIcon } from './ui/FileIcon';
import { getAssetSignedUrl } from '../services/api/assets';

interface AssetPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
  onDownload?: () => void;
}

export const AssetPreviewModal: React.FC<AssetPreviewModalProps> = ({
  isOpen,
  onClose,
  asset,
  onDownload,
}) => {
  const [assetUrl, setAssetUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Load signed URL when modal opens
  useEffect(() => {
    if (isOpen && asset?.storage_path) {
      setIsLoadingUrl(true);
      setUrlError(null);
      getAssetSignedUrl(asset.storage_path)
        .then(url => {
          setAssetUrl(url);
          setIsLoadingUrl(false);
        })
        .catch(error => {
          console.error('Error loading asset URL:', error);
          setUrlError('Failed to load asset');
          setIsLoadingUrl(false);
        });
    } else {
      setAssetUrl(null);
      setUrlError(null);
    }
  }, [isOpen, asset?.storage_path]);

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !asset) return null;

  const fileType = asset.file_type?.toLowerCase() || '';
  const fileName = asset.name?.toLowerCase() || '';

  // Determine if file is previewable
  const isImage = fileType.includes('image') || fileName.match(/\.(jpg|jpeg|png|gif|svg|webp|bmp)$/);
  const isPDF = fileType.includes('pdf') || fileName.endsWith('.pdf');
  const isVideo = fileType.includes('video') || fileName.match(/\.(mp4|mov|webm|ogg)$/);
  const isAudio = fileType.includes('audio') || fileName.match(/\.(mp3|wav|ogg|m4a)$/);
  const isOffice = fileName.match(/\.(docx|xlsx|pptx|doc|xls|ppt)$/);

  const isPreviewable = isImage || isPDF || isVideo || isAudio || isOffice;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FileIcon
              fileType={asset.file_type}
              fileName={asset.name}
              className="w-10 h-10 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground truncate">{asset.name}</h2>
              <p className="text-sm text-muted-foreground">
                {asset.category && <span className="capitalize">{asset.category.replace('_', ' ')}</span>}
                {asset.category && asset.file_size && ' • '}
                {asset.file_size && formatFileSize(asset.file_size)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {onDownload && assetUrl && (
              <button
                onClick={onDownload}
                className="p-2 text-primary hover:text-blue-300 hover:bg-muted rounded-lg transition-colors"
                title="Download"
              >
                <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" className="w-6 h-6" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              title="Close"
            >
              <Icon path="M6 18L18 6M6 6l12 12" className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto bg-background flex items-center justify-center p-4">
          {isLoadingUrl ? (
            <div className="text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading preview...</p>
            </div>
          ) : urlError ? (
            <div className="text-center text-muted-foreground">
              <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-xl mb-2">Failed to load preview</p>
              <p className="text-sm">{urlError}</p>
            </div>
          ) : !assetUrl ? (
            <div className="text-center text-muted-foreground">
              <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p>No preview available</p>
              <p className="text-sm mt-2">File path not found</p>
            </div>
          ) : isImage ? (
            <div className="max-w-full max-h-full flex items-center justify-center">
              <img
                src={assetUrl}
                alt={asset.name}
                className="max-w-full max-h-[calc(90vh-200px)] object-contain rounded"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = `
                    <div class="text-center text-muted-foreground">
                      <p>Failed to load image</p>
                    </div>
                  `;
                }}
              />
            </div>
          ) : isPDF ? (
            <iframe
              src={assetUrl}
              className="w-full h-[calc(90vh-200px)] rounded bg-white"
              title={asset.name}
            />
          ) : isVideo ? (
            <video
              controls
              className="max-w-full max-h-[calc(90vh-200px)] rounded"
              src={assetUrl}
            >
              Your browser does not support the video tag.
            </video>
          ) : isAudio ? (
            <div className="text-center">
              <FileIcon
                fileType={asset.file_type}
                fileName={asset.name}
                className="w-32 h-32 mx-auto mb-6"
              />
              <audio controls className="w-full max-w-md">
                <source src={assetUrl} />
                Your browser does not support the audio tag.
              </audio>
            </div>
          ) : isOffice ? (
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(assetUrl)}`}
              className="w-full h-[calc(90vh-200px)] rounded bg-white border-0 shadow-inner"
              title={asset.name}
            />
          ) : (
            <div className="text-center text-muted-foreground">
              <FileIcon
                fileType={asset.file_type}
                fileName={asset.name}
                className="w-32 h-32 mx-auto mb-6"
              />
              <p className="text-xl mb-2">Preview not available</p>
              <p className="text-sm mb-6">This file type cannot be previewed in the browser</p>
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-6 rounded-lg flex items-center gap-2 mx-auto transition-colors"
                >
                  <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" className="w-5 h-5" />
                  Download File
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer with metadata */}
        {asset.description && (
          <div className="p-4 border-t border-border bg-card">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-muted-foreground">Description: </span>
              {asset.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
