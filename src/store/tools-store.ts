import { create } from 'zustand';

export type ToolType = 'select' | 'brush' | 'crop' | 'transform' | 'hand' | 'zoom' | 'censor';


interface BrushSettings {
  size: number;
  opacity: number;
  hardness: number;
  flow: number;
  color: string;
  pressureSensitive: boolean;
}


interface CensorSettings {
  shape: 'rectangle' | 'circle' | 'triangle' | 'freeform';
  effect: 'blur' | 'pixelate' | 'solid';
  blurRadius: number;
  pixelSize: number;
  solidColor: string;
}

interface ToolsState {
  activeTool: ToolType;
  brushSettings: BrushSettings;
  censorSettings: CensorSettings;
  isDrawing: boolean;
  cropRatio: string;
  transformMode: 'move' | 'resize' | 'rotate';
  constrainProportions: boolean;
  showGrid: boolean;
  showRulers: boolean;
  guides: { type: 'horizontal' | 'vertical'; position: number }[];
  
  setActiveTool: (tool: ToolType) => void;
  updateBrushSettings: (settings: Partial<BrushSettings>) => void;
  updateCensorSettings: (settings: Partial<CensorSettings>) => void;
  setIsDrawing: (drawing: boolean) => void;
  setCropRatio: (ratio: string) => void;
  setTransformMode: (mode: 'move' | 'resize' | 'rotate') => void;
  setConstrainProportions: (constrain: boolean) => void;
  setShowGrid: (show: boolean) => void;
  setShowRulers: (show: boolean) => void;
  addGuide: (guide: { type: 'horizontal' | 'vertical'; position: number }) => void;
  removeGuide: (index: number) => void;
}

export const useToolsStore = create<ToolsState>((set) => ({
  activeTool: 'brush',
  brushSettings: {
    size: 20,
    opacity: 100,
    hardness: 100,
    flow: 100,
    color: '#000000',
    pressureSensitive: false,
  },
  censorSettings: {
    shape: 'rectangle',
    effect: 'blur',
    blurRadius: 20,
    pixelSize: 20,
    solidColor: '#000000',
  },
  isDrawing: false,
  cropRatio: '',
  transformMode: 'move',
  constrainProportions: false,
  showGrid: false,
  showRulers: false,
  guides: [],

  setActiveTool: (tool) => set({ activeTool: tool }),
  
  updateBrushSettings: (settings) => set((state) => ({
    brushSettings: { ...state.brushSettings, ...settings },
  })),
  
  updateCensorSettings: (settings) => set((state) => ({
    censorSettings: { ...state.censorSettings, ...settings },
  })),
  
  setIsDrawing: (drawing) => set({ isDrawing: drawing }),
  
  setCropRatio: (ratio) => set({ cropRatio: ratio }),
  
  setTransformMode: (mode) => set({ transformMode: mode }),
  
  setConstrainProportions: (constrain) => set({ constrainProportions: constrain }),
  
  setShowGrid: (show) => set({ showGrid: show }),
  
  setShowRulers: (show) => set({ showRulers: show }),
  
  addGuide: (guide) => set((state) => ({
    guides: [...state.guides, guide],
  })),
  
  removeGuide: (index) => set((state) => ({
    guides: state.guides.filter((_, i) => i !== index),
  })),
}));