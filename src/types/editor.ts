import type Konva from 'konva';

export type LayerType = 'base' | 'paint' | 'adjustment' | 'censor' | 'overlay';

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  konvaLayer?: Konva.Layer;
  visible: boolean;
  opacity: number;
  blendMode: GlobalCompositeOperation;
  locked: boolean;
  order: number;
  parentGroup?: string;
}

export interface BaseImageLayer extends Layer {
  type: 'base';
  image?: HTMLImageElement;
  locked: true;
  movable: false;
}

export interface PaintLayer extends Layer {
  type: 'paint';
}

export interface AdjustmentLayer extends Layer {
  type: 'adjustment';
  adjustmentType: 'brightness' | 'contrast' | 'saturation' | 'exposure' | 'temperature' | 'shadows-highlights' | 'curves' | 'levels';
  parameters: AdjustmentParameters;
  filters?: any[];
}

export interface CensorLayer extends Layer {
  type: 'censor';
  censorType: 'solid' | 'blur' | 'pixelate';
  shape?: CensorShape;
  effect?: CensorEffect;
}

export interface AdjustmentParameters {
  brightness?: number; // -100 to +100
  contrast?: number; // -100 to +100
  saturation?: number; // -100 to +100
  shadows?: number; // 0 to +100
  highlights?: number; // -100 to 0
  exposure?: number; // -3 to +3
  temperature?: number; // -100 to +100
  tint?: number; // -100 to +100
  curves?: CurvePoints;
  levels?: LevelParameters;
}

export interface CurvePoints {
  rgb?: { x: number; y: number }[];
  red?: { x: number; y: number }[];
  green?: { x: number; y: number }[];
  blue?: { x: number; y: number }[];
}

export interface LevelParameters {
  inputBlack: number; // 0-255
  inputWhite: number; // 0-255
  gamma: number; // 0.1-10
  outputBlack: number; // 0-255
  outputWhite: number; // 0-255
}

export interface CensorEffect {
  type: 'solid' | 'blur' | 'pixelate';
  intensity?: number;
  color?: string;
  blurRadius?: number; // 1-50px for blur
  pixelSize?: number; // 5-100px for pixelate
}

export interface CensorShape {
  type: 'rectangle' | 'circle' | 'ellipse' | 'triangle' | 'freeform';
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  points?: { x: number; y: number }[];
}

export interface CanvasData {
  width: number;
  height: number;
  backgroundColor: string;
  resolution: number;
}

export interface EditorProject {
  id: string;
  name: string;
  created: Date;
  modified: Date;
  canvas: CanvasData;
  layers: Layer[];
}