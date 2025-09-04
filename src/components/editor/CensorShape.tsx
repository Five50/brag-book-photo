'use client';

import React, { useRef, useEffect } from 'react';
import { Group, Rect, Circle, Line, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { CensorLayer } from '@/types/editor';

interface CensorShapeProps {
  layer: CensorLayer;
  baseImage?: HTMLImageElement;
  canvasWidth: number;
  canvasHeight: number;
  isSelected: boolean;
  activeTool: string;
  onShapeClick: (e: any) => void;
  onDragEnd: (e: any) => void;
  onTransformEnd: (e: any) => void;
}

export default function CensorShape({
  layer,
  baseImage,
  canvasWidth,
  canvasHeight,
  isSelected,
  activeTool,
  onShapeClick,
  onDragEnd,
  onTransformEnd,
}: CensorShapeProps) {
  const groupRef = useRef<any>(null);
  const imageRef = useRef<any>(null);
  
  // Apply cache for better performance with filters
  useEffect(() => {
    if (imageRef.current && (layer.censorType === 'blur' || layer.censorType === 'pixelate')) {
      imageRef.current.cache();
    }
  }, [layer.censorType, layer.effect?.blurRadius, layer.effect?.pixelSize, layer.shape?.bounds]);

  const boundsX = layer.shape?.bounds?.x || 100;
  const boundsY = layer.shape?.bounds?.y || 100;
  const boundsWidth = layer.shape?.bounds?.width || 200;
  const boundsHeight = layer.shape?.bounds?.height || 200;
  
  const centerX = boundsX + boundsWidth / 2;
  const centerY = boundsY + boundsHeight / 2;
  const radius = Math.min(boundsWidth, boundsHeight) / 2;

  if (layer.censorType === 'solid') {
    // Solid fill - just render the shape
    if (layer.shape?.type === 'rectangle') {
      return (
        <Rect
          id={`censor-rect-${layer.id}`}
          x={layer.shape?.bounds?.x || 100}
          y={layer.shape?.bounds?.y || 100}
          width={layer.shape?.bounds?.width || 200}
          height={layer.shape?.bounds?.height || 200}
          fill={layer.effect?.color || '#000000'}
          draggable={isSelected && !layer.locked && activeTool === 'select'}
          onClick={onShapeClick}
          onDragEnd={(e) => {
        onDragEnd(e);
        // Re-cache after movement
        if (imageRef.current && (layer.censorType === 'blur' || layer.censorType === 'pixelate')) {
          setTimeout(() => {
            imageRef.current?.cache();
          }, 0);
        }
      }}
          onTransformEnd={onTransformEnd}
          dragBoundFunc={(pos) => {
            const width = layer.shape?.bounds?.width || 200;
            const height = layer.shape?.bounds?.height || 200;
            const x = Math.max(0, Math.min(canvasWidth - width, pos.x));
            const y = Math.max(0, Math.min(canvasHeight - height, pos.y));
            return { x, y };
          }}
        />
      );
    } else if (layer.shape?.type === 'circle') {
      return (
        <Circle
          id={`censor-circle-${layer.id}`}
          x={centerX}
          y={centerY}
          radius={radius}
          fill={layer.effect?.color || '#000000'}
          draggable={isSelected && !layer.locked && activeTool === 'select'}
          onClick={onShapeClick}
          onDragEnd={(e) => {
        onDragEnd(e);
        // Re-cache after movement
        if (imageRef.current && (layer.censorType === 'blur' || layer.censorType === 'pixelate')) {
          setTimeout(() => {
            imageRef.current?.cache();
          }, 0);
        }
      }}
          onTransformEnd={onTransformEnd}
          dragBoundFunc={(pos) => {
            const x = Math.max(radius, Math.min(canvasWidth - radius, pos.x));
            const y = Math.max(radius, Math.min(canvasHeight - radius, pos.y));
            return { x, y };
          }}
        />
      );
    } else if (layer.shape?.type === 'triangle') {
      const x = layer.shape?.bounds?.x || 100;
      const y = layer.shape?.bounds?.y || 100;
      const width = layer.shape?.bounds?.width || 200;
      const height = layer.shape?.bounds?.height || 200;
      const points = [
        x + width / 2, y,          // Top point
        x, y + height,              // Bottom left
        x + width, y + height       // Bottom right
      ];
      return (
        <Line
          id={`censor-triangle-${layer.id}`}
          points={points}
          closed={true}
          fill={layer.effect?.color || '#000000'}
          draggable={isSelected && !layer.locked && activeTool === 'select'}
          onClick={onShapeClick}
          onDragEnd={(e) => {
            const node = e.target;
            const newX = node.x();
            const newY = node.y();
            onDragEnd({
              ...e,
              target: {
                ...e.target,
                x: () => newX + x,
                y: () => newY + y
              }
            });
            node.x(0);
            node.y(0);
          }}
          onTransformEnd={onTransformEnd}
        />
      );
    }
  }

  // Blur or pixelate - render clipped image with effect
  if (!baseImage) return null;

  const clipFunc = (ctx: any) => {
    if (layer.shape?.type === 'rectangle') {
      ctx.rect(0, 0, layer.shape?.bounds?.width || 200, layer.shape?.bounds?.height || 200);
    } else if (layer.shape?.type === 'circle') {
      ctx.arc(
        (layer.shape?.bounds?.width || 200) / 2,
        (layer.shape?.bounds?.height || 200) / 2,
        radius,
        0,
        Math.PI * 2
      );
    } else if (layer.shape?.type === 'triangle') {
      const width = layer.shape?.bounds?.width || 200;
      const height = layer.shape?.bounds?.height || 200;
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(0, height);
      ctx.lineTo(width, height);
      ctx.closePath();
    } else if (layer.shape?.type === 'freeform' && layer.shape?.points) {
      const points = layer.shape.points;
      if (points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(points[0].x - (layer.shape?.bounds?.x || 0), points[0].y - (layer.shape?.bounds?.y || 0));
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x - (layer.shape?.bounds?.x || 0), points[i].y - (layer.shape?.bounds?.y || 0));
        }
        ctx.closePath();
      }
    }
  };

  // For blur/pixelate, we need to handle all shape types
  const shapeId = layer.shape?.type === 'rectangle' ? `censor-rect-${layer.id}` : 
                  layer.shape?.type === 'circle' ? `censor-circle-${layer.id}` :
                  layer.shape?.type === 'triangle' ? `censor-triangle-${layer.id}` :
                  `censor-freeform-${layer.id}`;
  
  return (
    <Group
      ref={groupRef}
      id={shapeId}
      name={`censor-shape-${layer.id}`}
      x={layer.shape?.bounds?.x || 100}
      y={layer.shape?.bounds?.y || 100}
      draggable={isSelected && !layer.locked && activeTool === 'select'}
      onClick={onShapeClick}
      onDragEnd={(e) => {
        onDragEnd(e);
        // Re-cache after movement
        if (imageRef.current && (layer.censorType === 'blur' || layer.censorType === 'pixelate')) {
          setTimeout(() => {
            imageRef.current?.cache();
          }, 0);
        }
      }}
      onTransformEnd={onTransformEnd}
      dragBoundFunc={(pos) => {
        const width = layer.shape?.bounds?.width || 200;
        const height = layer.shape?.bounds?.height || 200;
        
        // Constrain to canvas bounds
        const x = Math.max(0, Math.min(canvasWidth - width, pos.x));
        const y = Math.max(0, Math.min(canvasHeight - height, pos.y));
        
        return { x, y };
      }}
      clipFunc={clipFunc}
    >
      <KonvaImage
        ref={imageRef}
        image={baseImage}
        x={-(layer.shape?.bounds?.x || 100)}
        y={-(layer.shape?.bounds?.y || 100)}
        width={canvasWidth}
        height={canvasHeight}
        filters={[
          layer.censorType === 'blur' ? Konva.Filters.Blur :
          layer.censorType === 'pixelate' ? Konva.Filters.Pixelate :
          null
        ].filter(Boolean) as any[]}
        blurRadius={layer.effect?.blurRadius || 20}
        pixelSize={layer.effect?.pixelSize || 20}
        listening={false}
      />
    </Group>
  );
}