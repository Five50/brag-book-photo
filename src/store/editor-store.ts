import { create } from 'zustand';
import { Layer, BaseImageLayer, CanvasData } from '@/types/editor';
import type Konva from 'konva';

interface EditorState {
  stage: Konva.Stage | null;
  layers: Layer[];
  selectedLayerId: string | null;
  canvas: CanvasData;
  isLoading: boolean;
  
  setStage: (stage: Konva.Stage) => void;
  addLayer: (layer: Layer) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  deleteLayer: (id: string) => void;
  duplicateLayer: (id: string) => void;
  setSelectedLayer: (id: string | null) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  setCanvas: (canvas: CanvasData) => void;
  setLoading: (loading: boolean) => void;
  setBaseImage: (image: HTMLImageElement, metadata: { name: string; size: number }) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  stage: null,
  layers: [],
  selectedLayerId: null,
  canvas: {
    width: 800,
    height: 600,
    backgroundColor: '#ffffff',
    resolution: 72,
  },
  isLoading: false,

  setStage: (stage) => set({ stage }),

  addLayer: (layer) => set((state) => ({
    layers: [...state.layers, layer],
  })),

  updateLayer: (id, updates) => set((state) => ({
    layers: state.layers.map((layer) =>
      layer.id === id ? { ...layer, ...updates } : layer
    ),
  })),

  deleteLayer: (id) => set((state) => ({
    layers: state.layers.filter((layer) => layer.id !== id),
    selectedLayerId: state.selectedLayerId === id ? null : state.selectedLayerId,
  })),

  duplicateLayer: (id) => set((state) => {
    const layerToDuplicate = state.layers.find(l => l.id === id);
    if (!layerToDuplicate || layerToDuplicate.type === 'base') return state;

    const duplicatedLayer: Layer = {
      ...layerToDuplicate,
      id: `layer-${Date.now()}`,
      name: `${layerToDuplicate.name} copy`,
      order: layerToDuplicate.order + 1,
    };

    const index = state.layers.findIndex(l => l.id === id);
    const newLayers = [...state.layers];
    newLayers.splice(index + 1, 0, duplicatedLayer);

    return {
      layers: newLayers.map((layer, idx) => ({ ...layer, order: idx })),
      selectedLayerId: duplicatedLayer.id,
    };
  }),

  setSelectedLayer: (id) => set({ selectedLayerId: id }),

  reorderLayers: (fromIndex, toIndex) => set((state) => {
    const layers = [...state.layers];
    const baseLayerIndex = layers.findIndex(l => l.type === 'base');
    
    if (fromIndex === baseLayerIndex) return state;
    
    if (toIndex <= baseLayerIndex) {
      toIndex = baseLayerIndex + 1;
    }
    
    const [movedLayer] = layers.splice(fromIndex, 1);
    layers.splice(toIndex, 0, movedLayer);
    
    return {
      layers: layers.map((layer, index) => ({ ...layer, order: index })),
    };
  }),

  setCanvas: (canvas) => set({ canvas }),

  setLoading: (loading) => set({ isLoading: loading }),

  setBaseImage: (image, metadata) => {
    const baseLayer: BaseImageLayer = {
      id: 'base-layer',
      name: 'Background',
      type: 'base',
      visible: true,
      opacity: 100,
      blendMode: 'source-over',
      locked: true,
      movable: false,
      order: 0,
      image,
    };

    set((state) => ({
      layers: [baseLayer, ...state.layers.filter((l) => l.type !== 'base')],
      canvas: {
        ...state.canvas,
        width: image.width,
        height: image.height,
      },
    }));
  },
}));