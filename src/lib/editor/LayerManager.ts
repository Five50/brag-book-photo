import Konva from 'konva';
import { Layer, BaseImageLayer, PaintLayer } from '@/types/editor';

export class LayerManager {
  private stage: Konva.Stage;
  private layers: Map<string, Konva.Layer>;

  constructor(stage: Konva.Stage) {
    this.stage = stage;
    this.layers = new Map();
  }

  createBaseLayer(layer: BaseImageLayer): Konva.Layer {
    const konvaLayer = new Konva.Layer();
    
    if (layer.image) {
      const imageNode = new Konva.Image({
        image: layer.image,
        x: 0,
        y: 0,
        width: this.stage.width(),
        height: this.stage.height(),
      });
      konvaLayer.add(imageNode);
    }

    konvaLayer.opacity(layer.opacity / 100);
    konvaLayer.visible(layer.visible);
    
    this.stage.add(konvaLayer);
    this.layers.set(layer.id, konvaLayer);
    
    konvaLayer.moveToBottom();
    
    return konvaLayer;
  }

  createPaintLayer(layer: PaintLayer): Konva.Layer {
    const konvaLayer = new Konva.Layer();
    
    konvaLayer.opacity(layer.opacity / 100);
    konvaLayer.visible(layer.visible);
    
    this.stage.add(konvaLayer);
    this.layers.set(layer.id, konvaLayer);
    
    return konvaLayer;
  }

  updateLayerVisibility(layerId: string, visible: boolean) {
    const konvaLayer = this.layers.get(layerId);
    if (konvaLayer) {
      konvaLayer.visible(visible);
      this.stage.batchDraw();
    }
  }

  updateLayerOpacity(layerId: string, opacity: number) {
    const konvaLayer = this.layers.get(layerId);
    if (konvaLayer) {
      konvaLayer.opacity(opacity / 100);
      this.stage.batchDraw();
    }
  }

  reorderLayers(layers: Layer[]) {
    const baseLayer = layers.find(l => l.type === 'base');
    
    if (baseLayer) {
      const baseKonvaLayer = this.layers.get(baseLayer.id);
      if (baseKonvaLayer) {
        baseKonvaLayer.moveToBottom();
      }
    }

    layers
      .filter(l => l.type !== 'base')
      .forEach((layer, index) => {
        const konvaLayer = this.layers.get(layer.id);
        if (konvaLayer) {
          konvaLayer.zIndex(index + 1);
        }
      });

    this.stage.batchDraw();
  }

  deleteLayer(layerId: string) {
    const konvaLayer = this.layers.get(layerId);
    if (konvaLayer) {
      konvaLayer.destroy();
      this.layers.delete(layerId);
      this.stage.batchDraw();
    }
  }

  getLayer(layerId: string): Konva.Layer | undefined {
    return this.layers.get(layerId);
  }

  clear() {
    this.layers.forEach(layer => layer.destroy());
    this.layers.clear();
    this.stage.batchDraw();
  }
}