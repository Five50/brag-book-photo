'use client';

import React, { useState } from 'react';
import { useToolsStore, ToolType } from '@/store/tools-store';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChevronRight } from 'lucide-react';

interface Tool {
  id: ToolType;
  icon: string;
  name: string;
  shortcut?: string;
}

const tools: Tool[] = [
  { id: 'select', icon: 'arrow_selector_tool', name: 'Move', shortcut: 'V' },
  { id: 'crop', icon: 'crop', name: 'Crop', shortcut: 'C' },
  { id: 'transform', icon: 'transform', name: 'Transform', shortcut: 'T' },
  { id: 'brush', icon: 'brush', name: 'Brush', shortcut: 'B' },
  { id: 'censor', icon: 'blur_on', name: 'Censor' },
  { id: 'hand', icon: 'pan_tool', name: 'Hand', shortcut: 'H' },
  { id: 'zoom', icon: 'search', name: 'Zoom', shortcut: 'Z' },
];

const cropPresets = [
  { value: 'free', label: 'Free', icon: 'crop_free' },
  { value: '1:1', label: 'Square', icon: 'crop_square' },
  { value: '3:2', label: '3:2', icon: 'crop_3_2' },
  { value: '4:3', label: '4:3', icon: 'crop_landscape' },
  { value: '5:4', label: '5:4', icon: 'crop_5_4' },
  { value: '16:9', label: '16:9', icon: 'crop_16_9' },
];

export default function ToolPalette() {
  const { 
    activeTool, 
    setActiveTool, 
    brushSettings, 
    updateBrushSettings,
    censorSettings,
    updateCensorSettings,
    cropRatio,
    setCropRatio,
    constrainProportions,
    setConstrainProportions,
    showGrid,
    setShowGrid,
    showRulers,
    setShowRulers,
  } = useToolsStore();

  const [showCropMenu, setShowCropMenu] = useState(false);

  const handleToolClick = (toolId: ToolType) => {
    setActiveTool(toolId);
    if (toolId === 'crop') {
      setShowCropMenu(true);
    } else {
      setShowCropMenu(false);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateBrushSettings({ color: e.target.value });
  };

  return (
    <div className="flex h-full">
      <div className="w-12 bg-white border-r border-stone-200 flex flex-col overflow-y-auto">
        <TooltipProvider>
          <div className="p-1">
            <div className="flex flex-col gap-0.5">
              {tools.map((tool) => (
                <Tooltip key={tool.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeTool === tool.id ? 'default' : 'ghost'}
                      size="icon"
                      className={`w-10 h-10 p-0 ${
                        activeTool === tool.id 
                          ? 'bg-stone-900 hover:bg-stone-800 text-white' 
                          : 'hover:bg-stone-100 text-stone-700'
                      }`}
                      onClick={() => handleToolClick(tool.id)}
                    >
                      <span className="material-symbols-rounded text-[20px]">
                        {tool.icon}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>
                      {tool.name}
                      {tool.shortcut && (
                        <span className="ml-2 text-xs opacity-70">({tool.shortcut})</span>
                      )}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          <Separator className="my-2" />

          <div className="p-1 space-y-2">
            <div className="flex items-center gap-1">
              <input
                type="checkbox"
                id="grid"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="rounded h-3 w-3"
              />
              <Label htmlFor="grid" className="text-xs cursor-pointer">
                Grid
              </Label>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="checkbox"
                id="rulers"
                checked={showRulers}
                onChange={(e) => setShowRulers(e.target.checked)}
                className="rounded h-3 w-3"
              />
              <Label htmlFor="rulers" className="text-xs cursor-pointer">
                Rulers
              </Label>
            </div>
          </div>
        </TooltipProvider>
      </div>

      {/* Expandable side panel for crop options */}
      {activeTool === 'crop' && showCropMenu && (
        <div className="w-48 bg-white border-r border-stone-200 animate-in slide-in-from-left-2">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Crop Options</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowCropMenu(false)}
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium">Aspect Ratio</Label>
                {!cropRatio && (
                  <p className="text-xs text-stone-500 mt-2 mb-2">Draw a crop area to begin</p>
                )}
                <div className="mt-2 space-y-1">
                  {cropPresets.map((preset) => (
                    <label
                      key={preset.value}
                      className="flex items-center gap-2 p-2 rounded hover:bg-stone-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="cropRatio"
                        value={preset.value}
                        checked={cropRatio === preset.value}
                        onChange={(e) => setCropRatio(e.target.value)}
                        className="h-3 w-3"
                      />
                      <span className="material-symbols-rounded text-[18px] text-stone-600">
                        {preset.icon}
                      </span>
                      <span className="text-xs">{preset.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="constrain-crop"
                  checked={constrainProportions}
                  onChange={(e) => setConstrainProportions(e.target.checked)}
                  className="rounded h-3 w-3"
                />
                <Label htmlFor="constrain-crop" className="text-xs cursor-pointer">
                  Constrain Proportions
                </Label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tool-specific settings panel */}
      {activeTool === 'transform' && (
        <div className="w-48 bg-white border-r border-stone-200 animate-in slide-in-from-left-2">
          <div className="p-3">
            <h3 className="text-sm font-medium mb-3">Transform</h3>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="constrain"
                checked={constrainProportions}
                onChange={(e) => setConstrainProportions(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="constrain" className="text-xs cursor-pointer">
                Constrain Proportions
              </Label>
            </div>
          </div>
        </div>
      )}

      {activeTool === 'brush' && (
        <div className="w-48 bg-white border-r border-stone-200 animate-in slide-in-from-left-2">
          <div className="p-3 space-y-4">
            <h3 className="text-sm font-medium">Brush Settings</h3>
            
            <div>
              <Label className="text-xs">Size</Label>
              <Slider
                value={[brushSettings.size]}
                onValueChange={([value]) => updateBrushSettings({ size: value })}
                min={1}
                max={500}
                step={1}
                className="mt-1"
              />
              <div className="text-xs text-center text-stone-600 mt-1">
                {brushSettings.size}px
              </div>
            </div>

            <div>
              <Label className="text-xs">Opacity</Label>
              <Slider
                value={[brushSettings.opacity]}
                onValueChange={([value]) => updateBrushSettings({ opacity: value })}
                min={0}
                max={100}
                step={1}
                className="mt-1"
              />
              <div className="text-xs text-center text-stone-600 mt-1">
                {brushSettings.opacity}%
              </div>
            </div>

            <div>
              <Label className="text-xs">Hardness</Label>
              <Slider
                value={[brushSettings.hardness]}
                onValueChange={([value]) => updateBrushSettings({ hardness: value })}
                min={0}
                max={100}
                step={1}
                className="mt-1"
              />
              <div className="text-xs text-center text-stone-600 mt-1">
                {brushSettings.hardness}%
              </div>
            </div>

            <div>
              <Label className="text-xs">Flow</Label>
              <Slider
                value={[brushSettings.flow]}
                onValueChange={([value]) => updateBrushSettings({ flow: value })}
                min={0}
                max={100}
                step={1}
                className="mt-1"
              />
              <div className="text-xs text-center text-stone-600 mt-1">
                {brushSettings.flow}%
              </div>
            </div>

            <div>
              <Label className="text-xs">Color</Label>
              <div className="relative mt-1">
                <input
                  type="color"
                  value={brushSettings.color}
                  onChange={handleColorChange}
                  className="w-full h-8 rounded cursor-pointer border-2 border-stone-300"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pressure"
                checked={brushSettings.pressureSensitive}
                onChange={(e) => updateBrushSettings({ pressureSensitive: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="pressure" className="text-xs cursor-pointer">
                Pressure Sensitive
              </Label>
            </div>
          </div>
        </div>
      )}

      {activeTool === 'censor' && (
        <div className="w-48 bg-white border-r border-stone-200 animate-in slide-in-from-left-2">
          <div className="p-3 space-y-4">
            <h3 className="text-sm font-medium">Censor Settings</h3>
            
            <div>
              <Label className="text-xs">Shape</Label>
              <div className="grid grid-cols-2 gap-1 mt-1">
                <Button
                  size="sm"
                  variant={censorSettings.shape === 'rectangle' ? 'default' : 'outline'}
                  onClick={() => updateCensorSettings({ shape: 'rectangle' })}
                  className="h-7 p-0"
                  title="Rectangle"
                >
                  <span className="material-symbols-rounded text-[16px]">square</span>
                </Button>
                <Button
                  size="sm"
                  variant={censorSettings.shape === 'circle' ? 'default' : 'outline'}
                  onClick={() => updateCensorSettings({ shape: 'circle' })}
                  className="h-7 p-0"
                  title="Circle"
                >
                  <span className="material-symbols-rounded text-[16px]">circle</span>
                </Button>
                <Button
                  size="sm"
                  variant={censorSettings.shape === 'triangle' ? 'default' : 'outline'}
                  onClick={() => updateCensorSettings({ shape: 'triangle' })}
                  className="h-7 p-0"
                  title="Triangle"
                >
                  <span className="material-symbols-rounded text-[16px]">change_history</span>
                </Button>
                <Button
                  size="sm"
                  variant={censorSettings.shape === 'freeform' ? 'default' : 'outline'}
                  onClick={() => updateCensorSettings({ shape: 'freeform' })}
                  className="h-7 p-0"
                  title="Freeform"
                >
                  <span className="material-symbols-rounded text-[16px]">draw</span>
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-xs">Effect</Label>
              <select
                value={censorSettings.effect}
                onChange={(e) => updateCensorSettings({ effect: e.target.value as 'blur' | 'pixelate' | 'solid' })}
                className="w-full mt-1 text-xs border rounded p-1"
              >
                <option value="blur">Blur</option>
                <option value="pixelate">Pixelate</option>
                <option value="solid">Solid</option>
              </select>
            </div>

            {censorSettings.effect === 'blur' && (
              <div>
                <Label className="text-xs">Blur Radius</Label>
                <Slider
                  value={[censorSettings.blurRadius]}
                  onValueChange={([value]) => updateCensorSettings({ blurRadius: value })}
                  min={1}
                  max={50}
                  step={1}
                  className="mt-1"
                />
                <div className="text-xs text-center text-stone-600 mt-1">
                  {censorSettings.blurRadius}px
                </div>
              </div>
            )}

            {censorSettings.effect === 'pixelate' && (
              <div>
                <Label className="text-xs">Pixel Size</Label>
                <Slider
                  value={[censorSettings.pixelSize]}
                  onValueChange={([value]) => updateCensorSettings({ pixelSize: value })}
                  min={5}
                  max={100}
                  step={5}
                  className="mt-1"
                />
                <div className="text-xs text-center text-stone-600 mt-1">
                  {censorSettings.pixelSize}px
                </div>
              </div>
            )}

            {censorSettings.effect === 'solid' && (
              <div>
                <Label className="text-xs">Color</Label>
                <div className="relative mt-1">
                  <input
                    type="color"
                    value={censorSettings.solidColor}
                    onChange={(e) => updateCensorSettings({ solidColor: e.target.value })}
                    className="w-full h-8 rounded cursor-pointer border"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}