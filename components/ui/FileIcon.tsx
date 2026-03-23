import React from 'react';
import { Icon } from './Icon';

interface FileIconProps {
  fileType?: string | null;
  fileName?: string;
  className?: string;
}

export const FileIcon: React.FC<FileIconProps> = ({ fileType, fileName, className = "w-12 h-12" }) => {
  const getIconForFileType = () => {
    const type = fileType?.toLowerCase() || '';
    const name = fileName?.toLowerCase() || '';

    // Images
    if (type.includes('image') || name.match(/\.(jpg|jpeg|png|gif|svg|webp|bmp)$/)) {
      return {
        path: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
        color: "text-purple-400",
        bg: "bg-purple-500/20"
      };
    }

    // PDF
    if (type.includes('pdf') || name.endsWith('.pdf')) {
      return {
        path: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z",
        color: "text-red-400",
        bg: "bg-red-500/20"
      };
    }

    // Word
    if (type.includes('word') || type.includes('document') || name.match(/\.(doc|docx)$/)) {
      return {
        path: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
        color: "text-primary",
        bg: "bg-primary/20"
      };
    }

    // Excel
    if (type.includes('excel') || type.includes('spreadsheet') || name.match(/\.(xls|xlsx|csv)$/)) {
      return {
        path: "M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
        color: "text-green-400",
        bg: "bg-green-500/20"
      };
    }

    // PowerPoint
    if (type.includes('presentation') || name.match(/\.(ppt|pptx)$/)) {
      return {
        path: "M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z",
        color: "text-orange-400",
        bg: "bg-orange-500/20"
      };
    }

    // Video
    if (type.includes('video') || name.match(/\.(mp4|mov|avi|mkv|webm)$/)) {
      return {
        path: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
        color: "text-pink-400",
        bg: "bg-pink-500/20"
      };
    }

    // Audio
    if (type.includes('audio') || name.match(/\.(mp3|wav|ogg|m4a)$/)) {
      return {
        path: "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3",
        color: "text-indigo-400",
        bg: "bg-indigo-500/20"
      };
    }

    // ZIP/Archive
    if (type.includes('zip') || type.includes('compressed') || name.match(/\.(zip|rar|7z|tar|gz)$/)) {
      return {
        path: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4",
        color: "text-yellow-400",
        bg: "bg-yellow-500/20"
      };
    }

    // Code files
    if (name.match(/\.(js|ts|jsx|tsx|html|css|json|xml|py|java|cpp|c|php)$/)) {
      return {
        path: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
        color: "text-cyan-400",
        bg: "bg-cyan-500/20"
      };
    }

    // Default/Unknown
    return {
      path: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z",
      color: "text-muted-foreground",
      bg: "bg-gray-500/20"
    };
  };

  const icon = getIconForFileType();

  return (
    <div className={`${icon.bg} ${icon.color} rounded-lg flex items-center justify-center p-3 ${className}`}>
      <Icon path={icon.path} className="w-full h-full" />
    </div>
  );
};
