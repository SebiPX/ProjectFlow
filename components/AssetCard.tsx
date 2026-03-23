
import React, { useState, useEffect } from 'react';
import { Asset } from '../types/supabase';
import { getAssetSignedUrl } from '../services/api/assets';
import { FileIcon } from './ui/FileIcon';
import { Icon } from './ui/Icon';

interface AssetCardProps {
    asset: Asset;
    onDownload: (storagePath: string, name: string) => void;
    onDelete: (id: string, name: string) => void;
    onClick: () => void;
    onChangeStatus: (asset: Asset) => void;
    className?: string;
    style?: React.CSSProperties;
}

export const AssetCard: React.FC<AssetCardProps> = ({
    asset,
    onDownload,
    onDelete,
    onClick,
    onChangeStatus,
    className = '',
    style
}) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        if (asset.storage_path && asset.file_type?.startsWith('image/')) {
            getAssetSignedUrl(asset.storage_path)
                .then(url => setImageUrl(url))
                .catch(err => console.error('Error loading image URL:', err));
        }
    }, [asset.storage_path, asset.file_type]);

    return (
        <div
            className={`bg-card rounded-lg overflow-hidden hover:bg-gray-750 transition-colors cursor-pointer ${className}`}
            onClick={onClick}
            style={style}
        >
            {/* Thumbnail/Icon Area */}
            <div className="relative h-48 bg-background/50 flex items-center justify-center">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                    />
                ) : null}
                <div className={imageUrl ? 'hidden' : ''}>
                    <FileIcon
                        fileType={asset.file_type}
                        fileName={asset.name}
                        className="w-20 h-20"
                    />
                </div>
                <span className="absolute top-2 right-2 text-xs px-2 py-1 bg-background/90 rounded-full text-muted-foreground capitalize">
                    {asset.status?.replace('_', ' ')}
                </span>
            </div>

            {/* Content Area */}
            <div className="p-4">
                <h3 className="font-semibold text-foreground text-base mb-1 truncate" title={asset.name}>
                    {asset.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">
                    {asset.category} • {((asset.file_size || 0) / 1024).toFixed(1)} KB
                </p>
                {asset.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2" title={asset.description}>
                        {asset.description}
                    </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center text-xs text-muted-foreground">
                        <Icon path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" className="w-4 h-4 mr-1" />
                        <span className="truncate">{asset.uploader?.full_name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        {asset.storage_path && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDownload(asset.storage_path!, asset.name);
                                }}
                                className="p-1.5 text-primary hover:text-blue-300 hover:bg-muted rounded transition-colors"
                                title="Download"
                            >
                                <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onChangeStatus(asset);
                            }}
                            className="p-1.5 text-yellow-400 hover:text-yellow-300 hover:bg-muted rounded transition-colors"
                            title="Change Status"
                        >
                            <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(asset.id, asset.name);
                            }}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-muted rounded transition-colors"
                            title="Delete"
                        >
                            <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
