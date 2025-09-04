'use client';

import React from 'react';
import { useEditorStore } from '@/store/editor-store';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AdjustmentLayer, CensorLayer, Layer } from '@/types/editor';

const adjustmentTypes = [
  { id: 'brightness', name: 'Brightness', icon: 'light_mode' },
  { id: 'contrast', name: 'Contrast', icon: 'contrast' },
  { id: 'saturation', name: 'Saturation', icon: 'palette' },
  { id: 'exposure', name: 'Exposure', icon: 'exposure' },
  { id: 'temperature', name: 'Temperature', icon: 'thermostat' },
  { id: 'shadows-highlights', name: 'Shadows/Highlights', icon: 'tonality' },
];

const censorShapes = [
  { id: 'rectangle', name: 'Square', icon: 'square' },
  { id: 'circle', name: 'Circle', icon: 'circle' },
  { id: 'triangle', name: 'Triangle', icon: 'change_history' },
  { id: 'freeform', name: 'Freeform', icon: 'draw' },
];

const censorEffects = [
  { id: 'solid', name: 'Solid Fill', icon: 'format_color_fill' },
  { id: 'blur', name: 'Blur', icon: 'blur_on' },
  { id: 'pixelate', name: 'Pixelate', icon: 'grid_view' },
];

export default function AdjustmentsPanel() {
  const { layers, selectedLayerId, updateLayer, addLayer } = useEditorStore();
  const [selectedCensorShape, setSelectedCensorShape] = React.useState('rectangle');
  const [selectedCensorEffect, setSelectedCensorEffect] = React.useState('blur');
  
  const selectedLayer = layers.find(l => l.id === selectedLayerId);
  const isAdjustmentLayer = selectedLayer?.type === 'adjustment';
  const isCensorLayer = selectedLayer?.type === 'censor';

  const handleAddAdjustmentLayer = (type: string) => {
    const newLayer: AdjustmentLayer = {
      id: `adj-${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Adjustment`,
      type: 'adjustment',
      adjustmentType: type as AdjustmentLayer['adjustmentType'],
      parameters: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        exposure: 0,
        temperature: 0,
        tint: 0,
        shadows: 0,
        highlights: 0,
      },
      visible: true,
      opacity: 100,
      blendMode: 'source-over',
      locked: false,
      order: layers.length,
    };
    
    addLayer(newLayer);
  };

  const handleAddCensorLayer = (shape: string, effect: string) => {
    const newLayer = {
      id: `censor-${Date.now()}`,
      name: `Censor (${effect})`,
      type: 'censor' as const,
      censorType: effect as 'solid' | 'blur' | 'pixelate',
      shape: {
        type: shape as 'rectangle' | 'circle' | 'triangle' | 'freeform',
        bounds: { x: 100, y: 100, width: 200, height: 200 },
      },
      effect: {
        type: effect as 'solid' | 'blur' | 'pixelate',
        intensity: 50,
        color: '#000000',
        blurRadius: effect === 'blur' ? 20 : undefined,
        pixelSize: effect === 'pixelate' ? 20 : undefined,
      },
      visible: true,
      opacity: 100,
      blendMode: 'source-over' as GlobalCompositeOperation,
      locked: false,
      order: layers.length,
    };
    
    addLayer(newLayer);
  };

  const handleAdjustmentChange = (parameter: string, value: number) => {
    if (!selectedLayer || selectedLayer.type !== 'adjustment') return;
    
    updateLayer(selectedLayerId!, {
      ...selectedLayer,
      parameters: {
        ...(selectedLayer as AdjustmentLayer).parameters,
        [parameter]: value,
      },
    } as Partial<Layer>);
  };

  const handleCensorEffectChange = (property: string, value: string | number) => {
    if (!selectedLayer || selectedLayer.type !== 'censor') return;
    
    updateLayer(selectedLayerId!, {
      ...selectedLayer,
      effect: {
        ...(selectedLayer as CensorLayer).effect,
        [property]: value,
      },
    } as Partial<Layer>);
  };

  return (
    <div className="w-80 bg-white border-l border-stone-200 flex flex-col">
      <div className="p-4 border-b border-stone-200">
        <h2 className="text-sm font-semibold text-stone-900">Adjustments & Effects</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Adjustment Layers */}
          <div>
            <h3 className="text-xs font-medium text-stone-700 mb-2">Adjustment Layers</h3>
            <div className="grid grid-cols-3 gap-1">
              <TooltipProvider>
                {adjustmentTypes.map((adj) => (
                  <Tooltip key={adj.id}>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-12 flex flex-col items-center gap-1 p-1"
                        onClick={() => handleAddAdjustmentLayer(adj.id)}
                      >
                        <span className="material-symbols-rounded text-[18px]">
                          {adj.icon}
                        </span>
                        <span className="text-[10px]">{adj.name}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add {adj.name} Adjustment</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          </div>

          <Separator />

          {/* Censoring Tools */}
          <div>
            <h3 className="text-xs font-medium text-stone-700 mb-2">Censoring Tools</h3>
            <div className="space-y-2">
              <Label className="text-xs">Shape</Label>
              <div className="grid grid-cols-4 gap-1">
                {censorShapes.map((shape) => (
                  <Button
                    key={shape.id}
                    size="sm"
                    variant={selectedCensorShape === shape.id ? 'default' : 'outline'}
                    className="h-8 flex flex-col items-center justify-center p-1"
                    onClick={() => {
                      setSelectedCensorShape(shape.id);
                      sessionStorage.setItem('censorShape', shape.id);
                    }}
                  >
                    <span className="material-symbols-rounded text-[14px]">
                      {shape.icon}
                    </span>
                  </Button>
                ))}
              </div>
              
              <Label className="text-xs">Effect</Label>
              <div className="grid grid-cols-3 gap-1">
                {censorEffects.map((effect) => (
                  <Button
                    key={effect.id}
                    size="sm"
                    variant={selectedCensorEffect === effect.id ? 'default' : 'outline'}
                    className="h-8"
                    onClick={() => {
                      setSelectedCensorEffect(effect.id);
                      sessionStorage.setItem('censorEffect', effect.id);
                    }}
                  >
                    <span className="material-symbols-rounded text-[16px] mr-1">
                      {effect.icon}
                    </span>
                    <span className="text-[10px]">{effect.name}</span>
                  </Button>
                ))}
              </div>
              
              <Button
                size="sm"
                className="w-full mt-2"
                onClick={() => {
                  handleAddCensorLayer(selectedCensorShape, selectedCensorEffect);
                }}
              >
                <span className="material-symbols-rounded text-[16px] mr-1">
                  add
                </span>
                Add Censor Layer
              </Button>
            </div>
          </div>

          <Separator />

          {/* Active Adjustment Controls */}
          {isAdjustmentLayer && selectedLayer && (
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-stone-700">
                {(selectedLayer as AdjustmentLayer).name} Settings
              </h3>
              
              {(selectedLayer as AdjustmentLayer).adjustmentType === 'brightness' && (
                <div>
                  <Label className="text-xs">Brightness</Label>
                  <Slider
                    value={[(selectedLayer as AdjustmentLayer).parameters.brightness || 0]}
                    onValueChange={([value]) => handleAdjustmentChange('brightness', value)}
                    min={-100}
                    max={100}
                    step={1}
                    className="mt-1"
                  />
                  <div className="text-xs text-center text-stone-600 mt-1">
                    {(selectedLayer as AdjustmentLayer).parameters.brightness || 0}
                  </div>
                </div>
              )}

              {(selectedLayer as AdjustmentLayer).adjustmentType === 'contrast' && (
                <div>
                  <Label className="text-xs">Contrast</Label>
                  <Slider
                    value={[(selectedLayer as AdjustmentLayer).parameters.contrast || 0]}
                    onValueChange={([value]) => handleAdjustmentChange('contrast', value)}
                    min={-100}
                    max={100}
                    step={1}
                    className="mt-1"
                  />
                  <div className="text-xs text-center text-stone-600 mt-1">
                    {(selectedLayer as AdjustmentLayer).parameters.contrast || 0}
                  </div>
                </div>
              )}

              {(selectedLayer as AdjustmentLayer).adjustmentType === 'saturation' && (
                <div>
                  <Label className="text-xs">Saturation</Label>
                  <Slider
                    value={[(selectedLayer as AdjustmentLayer).parameters.saturation || 0]}
                    onValueChange={([value]) => handleAdjustmentChange('saturation', value)}
                    min={-100}
                    max={100}
                    step={1}
                    className="mt-1"
                  />
                  <div className="text-xs text-center text-stone-600 mt-1">
                    {(selectedLayer as AdjustmentLayer).parameters.saturation || 0}
                  </div>
                </div>
              )}

              {(selectedLayer as AdjustmentLayer).adjustmentType === 'exposure' && (
                <div>
                  <Label className="text-xs">Exposure</Label>
                  <Slider
                    value={[(selectedLayer as AdjustmentLayer).parameters.exposure || 0]}
                    onValueChange={([value]) => handleAdjustmentChange('exposure', value)}
                    min={-3}
                    max={3}
                    step={0.1}
                    className="mt-1"
                  />
                  <div className="text-xs text-center text-stone-600 mt-1">
                    {((selectedLayer as AdjustmentLayer).parameters.exposure || 0).toFixed(1)} stops
                  </div>
                </div>
              )}

              {(selectedLayer as AdjustmentLayer).adjustmentType === 'temperature' && (
                <>
                  <div>
                    <Label className="text-xs">Temperature</Label>
                    <Slider
                      value={[(selectedLayer as AdjustmentLayer).parameters.temperature || 0]}
                      onValueChange={([value]) => handleAdjustmentChange('temperature', value)}
                      min={-100}
                      max={100}
                      step={1}
                      className="mt-1"
                    />
                    <div className="text-xs text-center text-stone-600 mt-1">
                      {(selectedLayer as AdjustmentLayer).parameters.temperature || 0}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Tint</Label>
                    <Slider
                      value={[(selectedLayer as AdjustmentLayer).parameters.tint || 0]}
                      onValueChange={([value]) => handleAdjustmentChange('tint', value)}
                      min={-100}
                      max={100}
                      step={1}
                      className="mt-1"
                    />
                    <div className="text-xs text-center text-stone-600 mt-1">
                      {(selectedLayer as AdjustmentLayer).parameters.tint || 0}
                    </div>
                  </div>
                </>
              )}

              {(selectedLayer as AdjustmentLayer).adjustmentType === 'shadows-highlights' && (
                <>
                  <div>
                    <Label className="text-xs">Shadows</Label>
                    <Slider
                      value={[(selectedLayer as AdjustmentLayer).parameters.shadows || 0]}
                      onValueChange={([value]) => handleAdjustmentChange('shadows', value)}
                      min={0}
                      max={100}
                      step={1}
                      className="mt-1"
                    />
                    <div className="text-xs text-center text-stone-600 mt-1">
                      {(selectedLayer as AdjustmentLayer).parameters.shadows || 0}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Highlights</Label>
                    <Slider
                      value={[(selectedLayer as AdjustmentLayer).parameters.highlights || 0]}
                      onValueChange={([value]) => handleAdjustmentChange('highlights', value)}
                      min={-100}
                      max={0}
                      step={1}
                      className="mt-1"
                    />
                    <div className="text-xs text-center text-stone-600 mt-1">
                      {(selectedLayer as AdjustmentLayer).parameters.highlights || 0}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Active Censor Controls */}
          {isCensorLayer && selectedLayer && (
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-stone-700">
                Censor Settings
              </h3>
              
              {(selectedLayer as CensorLayer).censorType === 'blur' && (
                <div>
                  <Label className="text-xs">Blur Radius</Label>
                  <Slider
                    value={[(selectedLayer as CensorLayer).effect?.blurRadius || 20]}
                    onValueChange={([value]) => handleCensorEffectChange('blurRadius', value)}
                    min={1}
                    max={50}
                    step={1}
                    className="mt-1"
                  />
                  <div className="text-xs text-center text-stone-600 mt-1">
                    {(selectedLayer as CensorLayer).effect?.blurRadius || 20}px
                  </div>
                </div>
              )}

              {(selectedLayer as CensorLayer).censorType === 'pixelate' && (
                <div>
                  <Label className="text-xs">Pixel Size</Label>
                  <Slider
                    value={[(selectedLayer as CensorLayer).effect?.pixelSize || 20]}
                    onValueChange={([value]) => handleCensorEffectChange('pixelSize', value)}
                    min={5}
                    max={100}
                    step={5}
                    className="mt-1"
                  />
                  <div className="text-xs text-center text-stone-600 mt-1">
                    {(selectedLayer as CensorLayer).effect?.pixelSize || 20}px
                  </div>
                </div>
              )}

              {(selectedLayer as CensorLayer).censorType === 'solid' && (
                <div>
                  <Label className="text-xs">Fill Color</Label>
                  <input
                    type="color"
                    value={(selectedLayer as CensorLayer).effect?.color || '#000000'}
                    onChange={(e) => handleCensorEffectChange('color', e.target.value)}
                    className="w-full h-8 mt-1 rounded cursor-pointer"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}