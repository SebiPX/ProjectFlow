
import React, { useMemo, useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    useDroppable,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Asset, AssetStatus } from '../types/supabase';
import { AssetCard } from './AssetCard';
import { useAuth } from '../lib/AuthContext';

interface AssetKanbanBoardProps {
    assets: Asset[];
    onStatusChange: (assetId: string, newStatus: AssetStatus) => void;
    onDownload: (path: string, name: string) => void;
    onDelete: (id: string) => void;
    onPreview: (asset: Asset) => void;
    onChangeStatus: (asset: Asset) => void;
}

const SortableAssetItem = ({ asset, ...props }: { asset: Asset } & any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: asset.id, data: { asset } });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3">
            <AssetCard {...props} asset={asset} />
        </div>
    );
};

const KanbanColumn = ({ id, title, assets, assetCardProps, isClient }: { id: AssetStatus, title: string, assets: Asset[], assetCardProps: any, isClient: boolean }) => {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div className="flex flex-col w-80 bg-background rounded-lg border border-border h-full flex-shrink-0">
            <div className={`p-4 border-b border-border font-semibold text-primary-foreground flex justify-between items-center
        ${id === AssetStatus.Approved ? 'bg-green-500/10 text-green-400' : ''}
        ${id === AssetStatus.ClientReview ? 'bg-primary/10 text-primary' : ''}
      `}>
                {title}
                <span className="bg-card text-muted-foreground text-xs py-0.5 px-2 rounded-full">
                    {assets.length}
                </span>
            </div>
            <div ref={setNodeRef} className="flex-1 p-3 overflow-y-auto min-h-[150px]">
                <SortableContext items={assets.map(a => a.id)} strategy={verticalListSortingStrategy}>
                    {assets.map((asset) => (
                        <SortableAssetItem
                            key={asset.id}
                            asset={asset}
                            // Pass down props for AssetCard
                            {...assetCardProps}
                            onClick={() => assetCardProps.onPreview(asset)}
                        />
                    ))}
                    {assets.length === 0 && (
                        <div className="h-full flex items-center justify-center text-gray-600 text-sm border-2 border-dashed border-border rounded-lg py-8">
                            Drop here
                        </div>
                    )}
                </SortableContext>
            </div>
        </div>
    );
};


export const AssetKanbanBoard: React.FC<AssetKanbanBoardProps> = ({
    assets,
    onStatusChange,
    onDownload,
    onDelete,
    onPreview,
    onChangeStatus,
}) => {
    const { profile } = useAuth();
    const isClient = profile?.role === 'client';

    // Columns definition
    const columns = useMemo(() => {
        const allCols = [
            { id: AssetStatus.Upload, title: 'Upload / Draft' },
            { id: AssetStatus.InternalReview, title: 'Internal Review' },
            { id: AssetStatus.ClientReview, title: 'Client Review' },
            { id: AssetStatus.Approved, title: 'Approved' },
        ];

        if (isClient) {
            return allCols.filter(col =>
                col.id === AssetStatus.ClientReview || col.id === AssetStatus.Approved
            );
        }
        return allCols;
    }, [isClient]);

    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeAsset, setActiveAsset] = useState<Asset | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        if (isClient) return; // Prevent drag for clients
        const { active } = event;
        setActiveId(active.id as string);
        setActiveAsset(active.data.current?.asset);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveAsset(null);

        if (!over) return;

        const activeAsset = active.data.current?.asset as Asset;
        // If dropped on a container (column)
        const overId = over.id as string;

        // Check if overId is a valid status status
        const isStatusColumn = Object.values(AssetStatus).includes(overId as any);

        if (activeAsset && isStatusColumn && activeAsset.status !== overId) {
            onStatusChange(activeAsset.id, overId as AssetStatus);
        }
    };

    // Render helpers
    const getAssetsByStatus = (status: AssetStatus) => {
        // Sort by position or date
        return assets.filter(a => a.status === status);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-full gap-4 overflow-x-auto pb-4">
                {columns.map((col) => (
                    <KanbanColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        assets={assets.filter(a => a.status === col.id)}
                        assetCardProps={{ onDownload, onDelete, onPreview, onChangeStatus }}
                        isClient={isClient}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeAsset ? (
                    <AssetCard
                        asset={activeAsset}
                        onDownload={() => { }}
                        onDelete={() => { }}
                        onClick={() => { }}
                        className="cursor-grabbing rotate-2 scale-105 shadow-2xl"
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

// Helper component for the column content
const KanbanDroppableColumn = ({ id, items, assetCardProps, isClient }: any) => {
    const { setNodeRef } = useDroppable({ id });

    return (
        <SortableContext items={items.map((i: any) => i.id)} strategy={verticalListSortingStrategy}>
            <div ref={setNodeRef} className="h-full min-h-[100px]">
                {items.map((asset: Asset) => (
                    <SortableAssetItem
                        key={asset.id}
                        asset={asset}
                        onDownload={assetCardProps.onDownload}
                        onDelete={assetCardProps.onDelete}
                        onClick={() => assetCardProps.onPreview(asset)}
                        onChangeStatus={assetCardProps.onChangeStatus}
                        disabled={isClient} // optional prop if we want to visualize disabled state
                    />
                ))}
            </div>
        </SortableContext>
    );
};
