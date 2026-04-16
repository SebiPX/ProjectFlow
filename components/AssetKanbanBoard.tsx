
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

const statusStyles = {
    [AssetStatus.Upload]: 'bg-secondary',
    [AssetStatus.InternalReview]: 'bg-accent',
    [AssetStatus.ClientReview]: 'bg-primary',
    [AssetStatus.ChangesRequested]: 'bg-yellow-500',
    [AssetStatus.Approved]: 'bg-emerald-500',
    [AssetStatus.Archived]: 'bg-muted',
};

const KanbanColumn = ({ id, title, assets, assetCardProps, isClient }: { id: AssetStatus, title: string, assets: Asset[], assetCardProps: any, isClient: boolean }) => {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div className="flex flex-col w-80 bg-muted/30 rounded-lg border border-border h-full flex-shrink-0">
            <div className="flex items-center justify-between p-3 border-b-2 border-border mb-2">
                <div className="flex items-center">
                    <span className={`w-3 h-3 rounded-full mr-2 ${statusStyles[id] || 'bg-muted'}`}></span>
                    <h3 className="font-semibold text-foreground">{title}</h3>
                </div>
                <span className="text-sm font-medium bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                    {assets.length}
                </span>
            </div>
            <div ref={setNodeRef} className="flex-1 p-3 overflow-y-auto min-h-[150px] kanban-column">
                <SortableContext items={assets.map(a => a.id)} strategy={verticalListSortingStrategy}>
                    {assets.map((asset) => (
                        <SortableAssetItem
                            key={asset.id}
                            asset={asset}
                            {...assetCardProps}
                            onClick={() => assetCardProps.onPreview(asset)}
                        />
                    ))}
                    {assets.length === 0 && (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg py-8">
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
