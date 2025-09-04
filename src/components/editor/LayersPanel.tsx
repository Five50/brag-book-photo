'use client';

import React, { useState } from 'react';
import { useEditorStore } from '@/store/editor-store';
import { useToolsStore } from '@/store/tools-store';
import { Layer } from '@/types/editor';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const blendModes: { value: GlobalCompositeOperation; label: string }[] = [
  { value: 'source-over', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'darken', label: 'Darken' },
  { value: 'lighten', label: 'Lighten' },
  { value: 'color-dodge', label: 'Color Dodge' },
  { value: 'color-burn', label: 'Color Burn' },
  { value: 'hard-light', label: 'Hard Light' },
  { value: 'soft-light', label: 'Soft Light' },
  { value: 'difference', label: 'Difference' },
  { value: 'exclusion', label: 'Exclusion' },
];

export default function LayersPanel() {
  const { layers, selectedLayerId, setSelectedLayer, updateLayer, reorderLayers, deleteLayer, duplicateLayer } = useEditorStore();
  const { setActiveTool } = useToolsStore();
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);

  const handleVisibilityToggle = (layerId: string, currentVisibility: boolean) => {
    updateLayer(layerId, { visible: !currentVisibility });
  };

  const handleOpacityChange = (layerId: string, opacity: number) => {
    updateLayer(layerId, { opacity });
  };

  const handleDragStart = (e: React.DragEvent, layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer?.type === 'base') {
      e.preventDefault();
      return;
    }
    setDraggedLayerId(layerId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, layerId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverLayerId(layerId);
  };

  const handleDragLeave = () => {
    setDragOverLayerId(null);
  };

  const handleDrop = (e: React.DragEvent, targetLayerId: string) => {
    e.preventDefault();
    
    if (!draggedLayerId || draggedLayerId === targetLayerId) {
      setDraggedLayerId(null);
      setDragOverLayerId(null);
      return;
    }

    const draggedIndex = layers.findIndex(l => l.id === draggedLayerId);
    const targetIndex = layers.findIndex(l => l.id === targetLayerId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      reorderLayers(draggedIndex, targetIndex);
    }

    setDraggedLayerId(null);
    setDragOverLayerId(null);
  };

  const handleAddLayer = () => {
    const paintLayerCount = layers.filter(l => l.type === 'paint').length;
    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: `Layer ${paintLayerCount + 1}`,
      type: 'paint',
      visible: true,
      opacity: 100,
      blendMode: 'source-over',
      locked: false,
      order: layers.length,
    };
    
    const store = useEditorStore.getState();
    store.addLayer(newLayer);
  };

  return (
    <div className="w-80 bg-white border-l border-stone-200 flex flex-col">
      <div className="p-4 border-b border-stone-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-stone-900">Layers</h2>
          <Button
            onClick={handleAddLayer}
            size="sm"
            className="h-7 px-2"
          >
            <span className="material-symbols-rounded text-lg">add</span>
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {layers.length === 0 && (
            <div className="text-center text-stone-500 text-sm py-8">
              Load an image to get started
            </div>
          )}
          {layers.length === 1 && layers[0].type === 'base' && (
            <div className="text-center text-stone-500 text-sm py-4">
              Click + to add a new layer for drawing
            </div>
          )}
          {layers.some(l => l.type === 'censor' && l.id === selectedLayerId) && (
            <div className="text-center text-stone-500 text-xs py-2 px-2 bg-blue-50 border border-blue-200 rounded mx-2 mb-2">
              ✓ Select tool activated - Drag to move, handles to resize
            </div>
          )}
          {layers.slice().reverse().map((layer) => (
            <div
              key={layer.id}
              draggable={layer.type !== 'base' && !layer.locked}
              onDragStart={(e) => handleDragStart(e, layer.id)}
              onDragOver={(e) => handleDragOver(e, layer.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, layer.id)}
              onClick={() => {
                setSelectedLayer(layer.id);
                // Auto-switch to select tool for censor layers to show handles
                if (layer.type === 'censor') {
                  setActiveTool('select');
                }
              }}
              className={`
                mb-2 p-3 rounded-lg border-2 transition-all cursor-pointer
                ${selectedLayerId === layer.id 
                  ? 'bg-stone-100 border-stone-400' 
                  : 'bg-white border-stone-200 hover:bg-stone-50'
                }
                ${layer.type === 'base' ? 'opacity-80' : ''}
                ${dragOverLayerId === layer.id && layer.type !== 'base' ? 'border-blue-400 border-dashed' : ''}
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVisibilityToggle(layer.id, layer.visible);
                    }}
                    className="p-1 hover:bg-stone-200 rounded transition-colors"
                  >
                    <span className="material-symbols-rounded text-lg">
                      {layer.visible ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                  
                  <div className="flex-1">
                    <span className="text-sm font-medium text-stone-900">
                      {layer.name}
                    </span>
                    {layer.type === 'censor' && (
                      <div className="text-xs text-stone-500 mt-0.5">
                        {(layer as any).shape?.type === 'rectangle' && '▢'}
                        {(layer as any).shape?.type === 'circle' && '○'}
                        {(layer as any).shape?.type === 'triangle' && '△'}
                        {(layer as any).shape?.type === 'freeform' && '✎'}
                        {' '}
                        {(layer as any).censorType === 'blur' && `Blur ${(layer as any).effect?.blurRadius}px`}
                        {(layer as any).censorType === 'pixelate' && `Pixel ${(layer as any).effect?.pixelSize}px`}
                        {(layer as any).censorType === 'solid' && 'Solid'}
                      </div>
                    )}
                  </div>
                  
                  {layer.locked && (
                    <span className="material-symbols-rounded text-sm text-stone-500">
                      lock
                    </span>
                  )}
                </div>

                {layer.type !== 'base' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <span className="material-symbols-rounded text-lg">more_vert</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => duplicateLayer(layer.id)}
                      >
                        <span className="material-symbols-rounded text-sm mr-2">content_copy</span>
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => updateLayer(layer.id, { locked: !layer.locked })}
                      >
                        <span className="material-symbols-rounded text-sm mr-2">
                          {layer.locked ? 'lock_open' : 'lock'}
                        </span>
                        {layer.locked ? 'Unlock' : 'Lock'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteLayer(layer.id)}
                        className="text-red-600"
                      >
                        <span className="material-symbols-rounded text-sm mr-2">delete</span>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div className="space-y-2">
                {layer.type !== 'base' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500 w-12">Blend:</span>
                    <Select
                      value={layer.blendMode}
                      onValueChange={(value: GlobalCompositeOperation) => 
                        updateLayer(layer.id, { blendMode: value })
                      }
                    >
                      <SelectTrigger className="h-7 text-xs flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {blendModes.map((mode) => (
                          <SelectItem key={mode.value} value={mode.value} className="text-xs">
                            {mode.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500 w-12">Opacity:</span>
                  <Slider
                    value={[layer.opacity]}
                    onValueChange={([value]) => handleOpacityChange(layer.id, value)}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-stone-700 w-8 text-right">
                    {layer.opacity}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}