'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer as KonvaLayer, Image as KonvaImage, Rect, Line, Circle, Transformer, Group, Text } from 'react-konva';
import { useEditorStore } from '@/store/editor-store';
import { useToolsStore } from '@/store/tools-store';
import { BaseImageLayer, AdjustmentLayer, CensorLayer, Layer } from '@/types/editor';
import ViewportControls from './ViewportControls';
import CensorShape from './CensorShape';
import Konva from 'konva';

interface CanvasProps {
  className?: string;
}

export default function Canvas({ className }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const stageRef = useRef<any>(null);
  const [currentPath, setCurrentPath] = useState<number[]>([]);
  const [paths, setPaths] = useState<{ points: number[]; color: string; size: number; opacity: number }[]>([]);
  const isDrawing = useRef(false);
  const currentLayerRef = useRef<Konva.Layer | null>(null);

  const { 
    stage, 
    setStage, 
    layers, 
    canvas,
    selectedLayerId,
    updateLayer,
    addLayer
  } = useEditorStore();

  const { 
    activeTool, 
    brushSettings,
    censorSettings,
    setIsDrawing,
    showGrid,
    showRulers,
    guides,
    cropRatio,
    constrainProportions,
  } = useToolsStore();
  
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [cropArea, setCropArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [selectedShapeRef, setSelectedShapeRef] = useState<any>(null);
  const transformerRef = useRef<any>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [draggingCropHandle, setDraggingCropHandle] = useState<string | null>(null);
  const [cropStartPos, setCropStartPos] = useState<{ x: number; y: number } | null>(null);
  const [initialCropArea, setInitialCropArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [stagePosition, setStagePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);
  const [previousTool, setPreviousTool] = useState<string | null>(null);

  const handleResize = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const scaleX = containerWidth / canvas.width;
    const scaleY = containerHeight / canvas.height;
    const newScale = Math.min(scaleX, scaleY, 1) * 0.9;

    setScale(newScale);
    setDimensions({
      width: containerWidth,
      height: containerHeight,
    });

    // Re-center the stage
    if (stageRef.current) {
      const stage = stageRef.current;
      const newX = (containerWidth - canvas.width * newScale) / 2;
      const newY = (containerHeight - canvas.height * newScale) / 2;
      stage.position({ x: newX, y: newY });
      setStagePosition({ x: newX, y: newY });
    }
  }, [canvas.width, canvas.height]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Handle spacebar for temporary hand tool
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !spacePressed) {
        e.preventDefault();
        setSpacePressed(true);
        setPreviousTool(activeTool);
        const { setActiveTool } = useToolsStore.getState();
        setActiveTool('hand');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setSpacePressed(false);
        if (previousTool) {
          const { setActiveTool } = useToolsStore.getState();
          setActiveTool(previousTool as any);
          setPreviousTool(null);
        }
        // Stop panning when releasing spacebar
        setIsPanning(false);
        setPanStart(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [spacePressed, activeTool, previousTool]);

  // Global mouse events for crop handle dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!draggingCropHandle || !cropArea || !initialCropArea || !cropStartPos) return;
      
      const dx = (e.clientX - cropStartPos.x) / scale;
      const dy = (e.clientY - cropStartPos.y) / scale;
      
      let newCropArea = { ...initialCropArea };
      const aspectRatio = (!cropRatio || cropRatio === 'free' || cropRatio === '') ? 0 : 
        cropRatio === '1:1' ? 1 :
        cropRatio === '4:3' ? 4/3 :
        cropRatio === '16:9' ? 16/9 :
        cropRatio === '3:2' ? 3/2 :
        cropRatio === '5:4' ? 5/4 : 1;
      
      switch(draggingCropHandle) {
        case 'tl': // Top-left
          newCropArea.x = Math.min(initialCropArea.x + dx, initialCropArea.x + initialCropArea.width - 20);
          newCropArea.width = initialCropArea.width - dx;
          if (cropRatio && cropRatio !== 'free' && cropRatio !== '') {
            newCropArea.height = newCropArea.width / aspectRatio;
            newCropArea.y = initialCropArea.y + initialCropArea.height - newCropArea.height;
          } else {
            newCropArea.y = Math.min(initialCropArea.y + dy, initialCropArea.y + initialCropArea.height - 20);
            newCropArea.height = initialCropArea.height - dy;
          }
          break;
          
        case 'tr': // Top-right
          newCropArea.width = Math.max(20, initialCropArea.width + dx);
          if (cropRatio && cropRatio !== 'free' && cropRatio !== '') {
            newCropArea.height = newCropArea.width / aspectRatio;
            newCropArea.y = initialCropArea.y + initialCropArea.height - newCropArea.height;
          } else {
            newCropArea.y = Math.min(initialCropArea.y + dy, initialCropArea.y + initialCropArea.height - 20);
            newCropArea.height = initialCropArea.height - dy;
          }
          break;
          
        case 'bl': // Bottom-left
          newCropArea.x = Math.min(initialCropArea.x + dx, initialCropArea.x + initialCropArea.width - 20);
          newCropArea.width = initialCropArea.width - dx;
          if (cropRatio && cropRatio !== 'free' && cropRatio !== '') {
            newCropArea.height = newCropArea.width / aspectRatio;
          } else {
            newCropArea.height = Math.max(20, initialCropArea.height + dy);
          }
          break;
          
        case 'br': // Bottom-right
          newCropArea.width = Math.max(20, initialCropArea.width + dx);
          if (cropRatio && cropRatio !== 'free' && cropRatio !== '') {
            newCropArea.height = newCropArea.width / aspectRatio;
          } else {
            newCropArea.height = Math.max(20, initialCropArea.height + dy);
          }
          break;
          
        case 't': // Top edge (free crop only)
          newCropArea.y = Math.min(initialCropArea.y + dy, initialCropArea.y + initialCropArea.height - 20);
          newCropArea.height = initialCropArea.height - dy;
          break;
          
        case 'b': // Bottom edge (free crop only)
          newCropArea.height = Math.max(20, initialCropArea.height + dy);
          break;
          
        case 'l': // Left edge (free crop only)
          newCropArea.x = Math.min(initialCropArea.x + dx, initialCropArea.x + initialCropArea.width - 20);
          newCropArea.width = initialCropArea.width - dx;
          break;
          
        case 'r': // Right edge (free crop only)
          newCropArea.width = Math.max(20, initialCropArea.width + dx);
          break;
      }
      
      // Ensure crop area stays within canvas bounds
      newCropArea.x = Math.max(0, newCropArea.x);
      newCropArea.y = Math.max(0, newCropArea.y);
      newCropArea.width = Math.min(canvas.width - newCropArea.x, newCropArea.width);
      newCropArea.height = Math.min(canvas.height - newCropArea.y, newCropArea.height);
      
      setCropArea(newCropArea);
    };

    const handleGlobalMouseUp = () => {
      if (draggingCropHandle) {
        setDraggingCropHandle(null);
        setCropStartPos(null);
        setInitialCropArea(null);
      }
    };

    if (draggingCropHandle) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggingCropHandle, cropArea, initialCropArea, cropStartPos, cropRatio, scale, canvas]);

  // Clear crop area when crop tool is deselected
  useEffect(() => {
    if (activeTool !== 'crop') {
      setCropArea(null);
    }
  }, [activeTool]);

  useEffect(() => {
    if (stageRef.current && !stage) {
      const newStage = stageRef.current;
      setStage(newStage);
      
      // Center the stage initially
      const initialX = (dimensions.width - canvas.width * scale) / 2;
      const initialY = (dimensions.height - canvas.height * scale) / 2;
      newStage.position({ x: initialX, y: initialY });
      setStagePosition({ x: initialX, y: initialY });
    }
  }, [stage, setStage, dimensions, canvas, scale]);

  useEffect(() => {
    if (stage && layers.length > 0) {
      layers.forEach((layer) => {
        if (layer.konvaLayer) {
          layer.konvaLayer.opacity(layer.opacity / 100);
          layer.konvaLayer.visible(layer.visible);
        }
      });
      stage.batchDraw();
    }
  }, [stage, layers]);

  // Attach transformer to selected shape
  useEffect(() => {
    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    
    if (selectedLayer?.type === 'censor') {
      // Find the shape node by ID after a small delay to ensure it's rendered
      setTimeout(() => {
        const stage = stageRef.current;
        if (stage) {
          // Look for the shape by its ID or name
          const shapeNode = stage.findOne(`#censor-rect-${selectedLayer.id}`) || 
                           stage.findOne(`#censor-circle-${selectedLayer.id}`) ||
                           stage.findOne(`#censor-triangle-${selectedLayer.id}`) ||
                           stage.findOne(`#censor-freeform-${selectedLayer.id}`) ||
                           stage.findOne(`.censor-shape-${selectedLayer.id}`);
          
          if (shapeNode && transformerRef.current) {
            setSelectedShapeRef(shapeNode);
            // Show transformer if select tool is active
            if (activeTool === 'select') {
              transformerRef.current.nodes([shapeNode]);
              transformerRef.current.getLayer().batchDraw();
            } else {
              transformerRef.current.nodes([]);
              transformerRef.current.getLayer()?.batchDraw();
            }
          }
        }
      }, 100); // Slightly longer delay to ensure tool switch happens
    } else if (transformerRef.current) {
      setSelectedShapeRef(null);
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedLayerId, layers, activeTool]);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.1;
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

    const clampedScale = Math.max(0.1, Math.min(32, newScale));

    stage.scale({ x: clampedScale, y: clampedScale });

    const newPos = {
      x: pointer.x - ((pointer.x - stage.x()) / oldScale) * clampedScale,
      y: pointer.y - ((pointer.y - stage.y()) / oldScale) * clampedScale,
    };
    stage.position(newPos);
    setScale(clampedScale);
  };

  const handleMouseDown = (e: any) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const relativePos = {
      x: (pos.x - stage.x()) / scale,
      y: (pos.y - stage.y()) / scale,
    };

    // Handle hand tool for panning
    if (activeTool === 'hand') {
      setIsPanning(true);
      setPanStart({ x: pos.x, y: pos.y });
      const currentPosition = stage.position();
      setStagePosition(currentPosition);
      return;
    }

    // Handle select tool - clear selection if clicking on empty space
    if (activeTool === 'select') {
      // Check if we clicked on the stage itself (not on a shape)
      if (e.target === stage || e.target.className === 'Layer') {
        const { setSelectedLayer } = useEditorStore.getState();
        setSelectedLayer(null);
        setSelectedShapeRef(null);
        if (transformerRef.current) {
          transformerRef.current.nodes([]);
          transformerRef.current.getLayer()?.batchDraw();
        }
      }
      return;
    }


    // Handle crop tool
    if (activeTool === 'crop' && !cropArea) {
      setIsSelecting(true);
      setSelectionStart(relativePos);
      setSelectionEnd(relativePos);
      return;
    }

    // Handle censor tool
    if (activeTool === 'censor') {
      if (censorSettings.shape === 'freeform') {
        // For freeform, start drawing
        const selectedLayer = layers.find(l => l.id === selectedLayerId);
        if (!selectedLayer || selectedLayer.type === 'base' || selectedLayer.locked) return;
        
        isDrawing.current = true;
        setIsDrawing(true);
        setCurrentPath([relativePos.x, relativePos.y]);
      } else {
        // For other shapes, start selection
        setIsSelecting(true);
        setSelectionStart(relativePos);
        setSelectionEnd(relativePos);
      }
      return;
    }

    // Handle brush tools
    if (activeTool === 'brush') {
      const selectedLayer = layers.find(l => l.id === selectedLayerId);
      
      // For brush, we need a paint layer
      if (!selectedLayer || selectedLayer.type !== 'paint' || selectedLayer.locked) return;

      isDrawing.current = true;
      setIsDrawing(true);
      setCurrentPath([relativePos.x, relativePos.y]);
      return;
    }
  };

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    const relativePos = {
      x: (pos.x - stage.x()) / scale,
      y: (pos.y - stage.y()) / scale,
    };

    // Handle crop handle dragging
    if (draggingCropHandle && cropArea && initialCropArea && cropStartPos) {
      const dx = (e.evt.clientX - cropStartPos.x) / scale;
      const dy = (e.evt.clientY - cropStartPos.y) / scale;
      
      let newCropArea = { ...initialCropArea };
      const aspectRatio = (!cropRatio || cropRatio === 'free' || cropRatio === '') ? 0 : 
        cropRatio === '1:1' ? 1 :
        cropRatio === '4:3' ? 4/3 :
        cropRatio === '16:9' ? 16/9 :
        cropRatio === '3:2' ? 3/2 :
        cropRatio === '5:4' ? 5/4 : 1;
      
      switch(draggingCropHandle) {
        case 'tl': // Top-left
          newCropArea.x = Math.min(initialCropArea.x + dx, initialCropArea.x + initialCropArea.width - 20);
          newCropArea.width = initialCropArea.width - dx;
          if (cropRatio && cropRatio !== 'free' && cropRatio !== '') {
            newCropArea.height = newCropArea.width / aspectRatio;
            newCropArea.y = initialCropArea.y + initialCropArea.height - newCropArea.height;
          } else {
            newCropArea.y = Math.min(initialCropArea.y + dy, initialCropArea.y + initialCropArea.height - 20);
            newCropArea.height = initialCropArea.height - dy;
          }
          break;
          
        case 'tr': // Top-right
          newCropArea.width = Math.max(20, initialCropArea.width + dx);
          if (cropRatio && cropRatio !== 'free' && cropRatio !== '') {
            newCropArea.height = newCropArea.width / aspectRatio;
            newCropArea.y = initialCropArea.y + initialCropArea.height - newCropArea.height;
          } else {
            newCropArea.y = Math.min(initialCropArea.y + dy, initialCropArea.y + initialCropArea.height - 20);
            newCropArea.height = initialCropArea.height - dy;
          }
          break;
          
        case 'bl': // Bottom-left
          newCropArea.x = Math.min(initialCropArea.x + dx, initialCropArea.x + initialCropArea.width - 20);
          newCropArea.width = initialCropArea.width - dx;
          if (cropRatio && cropRatio !== 'free' && cropRatio !== '') {
            newCropArea.height = newCropArea.width / aspectRatio;
          } else {
            newCropArea.height = Math.max(20, initialCropArea.height + dy);
          }
          break;
          
        case 'br': // Bottom-right
          newCropArea.width = Math.max(20, initialCropArea.width + dx);
          if (cropRatio && cropRatio !== 'free' && cropRatio !== '') {
            newCropArea.height = newCropArea.width / aspectRatio;
          } else {
            newCropArea.height = Math.max(20, initialCropArea.height + dy);
          }
          break;
          
        case 't': // Top edge (free crop only)
          newCropArea.y = Math.min(initialCropArea.y + dy, initialCropArea.y + initialCropArea.height - 20);
          newCropArea.height = initialCropArea.height - dy;
          break;
          
        case 'b': // Bottom edge (free crop only)
          newCropArea.height = Math.max(20, initialCropArea.height + dy);
          break;
          
        case 'l': // Left edge (free crop only)
          newCropArea.x = Math.min(initialCropArea.x + dx, initialCropArea.x + initialCropArea.width - 20);
          newCropArea.width = initialCropArea.width - dx;
          break;
          
        case 'r': // Right edge (free crop only)
          newCropArea.width = Math.max(20, initialCropArea.width + dx);
          break;
      }
      
      // Ensure crop area stays within canvas bounds
      newCropArea.x = Math.max(0, newCropArea.x);
      newCropArea.y = Math.max(0, newCropArea.y);
      newCropArea.width = Math.min(canvas.width - newCropArea.x, newCropArea.width);
      newCropArea.height = Math.min(canvas.height - newCropArea.y, newCropArea.height);
      
      setCropArea(newCropArea);
      return;
    }

    // Handle hand tool panning
    if (activeTool === 'hand' && isPanning && panStart && stagePosition) {
      const dx = pos.x - panStart.x;
      const dy = pos.y - panStart.y;
      
      stage.position({
        x: stagePosition.x + dx,
        y: stagePosition.y + dy,
      });
      stage.batchDraw();
      return;
    }

    // Handle selection/crop rectangle
    if (isSelecting && selectionStart) {
      setSelectionEnd(relativePos);
      
      if (activeTool === 'crop') {
        const width = relativePos.x - selectionStart.x;
        const height = relativePos.y - selectionStart.y;
        
        let finalWidth = width;
        let finalHeight = height;
        
        // Apply crop ratio constraints
        if (cropRatio && cropRatio !== 'free' && cropRatio !== '') {
          const [w, h] = cropRatio.split(':').map(Number);
          const aspectRatio = w / h;
          
          if (Math.abs(width) > Math.abs(height * aspectRatio)) {
            finalWidth = height * aspectRatio * Math.sign(width);
          } else {
            finalHeight = width / aspectRatio * Math.sign(height);
          }
        }
        
        setSelectionEnd({
          x: selectionStart.x + finalWidth,
          y: selectionStart.y + finalHeight,
        });
      }
      return;
    }

    // Handle drawing
    if (isDrawing.current) {
      setCurrentPath(prev => [...prev, relativePos.x, relativePos.y]);
      return;
    }
  };

  const handleMouseUp = () => {
    // Stop dragging crop handles
    if (draggingCropHandle) {
      setDraggingCropHandle(null);
      setCropStartPos(null);
      setInitialCropArea(null);
      return;
    }

    // Stop panning if using hand tool
    if (activeTool === 'hand') {
      setIsPanning(false);
      setPanStart(null);
      return;
    }

    // Handle selection completion
    if (isSelecting && selectionStart && selectionEnd) {
      const x = Math.min(selectionStart.x, selectionEnd.x);
      const y = Math.min(selectionStart.y, selectionEnd.y);
      const width = Math.abs(selectionEnd.x - selectionStart.x);
      const height = Math.abs(selectionEnd.y - selectionStart.y);
      
      if (activeTool === 'crop') {
        setCropArea({ x, y, width, height });
      } else if (activeTool === 'censor' && censorSettings.shape !== 'freeform') {
        // Only create censor if it's larger than minimum size
        if (width > 10 && height > 10) {
          // Create a new censor layer with the drawn shape
          const newLayer = {
            id: `censor-${Date.now()}`,
            name: `Censor (${censorSettings.effect})`,
            type: 'censor' as const,
            censorType: censorSettings.effect,
            shape: {
              type: censorSettings.shape,
              bounds: { x, y, width, height },
            },
            effect: {
              type: censorSettings.effect,
              intensity: 50,
              color: censorSettings.solidColor,
              blurRadius: censorSettings.blurRadius,
              pixelSize: censorSettings.pixelSize,
            },
            visible: true,
            opacity: 100,
            blendMode: 'source-over' as GlobalCompositeOperation,
            locked: false,
            order: layers.length,
          };
          
          addLayer(newLayer);
        }
      }
      
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      return;
    }
    
    // Handle drawing completion
    if (isDrawing.current) {
      isDrawing.current = false;
      setIsDrawing(false);
      
      if (currentPath.length > 2) {
        if (activeTool === 'censor' && censorSettings.shape === 'freeform') {
          // Create a freeform censor shape
          const bounds = {
            x: Math.min(...currentPath.filter((_, i) => i % 2 === 0)),
            y: Math.min(...currentPath.filter((_, i) => i % 2 === 1)),
            width: 0,
            height: 0,
          };
          bounds.width = Math.max(...currentPath.filter((_, i) => i % 2 === 0)) - bounds.x;
          bounds.height = Math.max(...currentPath.filter((_, i) => i % 2 === 1)) - bounds.y;
          
          const newLayer = {
            id: `censor-${Date.now()}`,
            name: `Censor Freeform (${censorSettings.effect})`,
            type: 'censor' as const,
            censorType: censorSettings.effect,
            shape: {
              type: 'freeform' as const,
              bounds,
              points: currentPath.reduce((acc, val, i) => {
                if (i % 2 === 0) {
                  acc.push({ x: val, y: currentPath[i + 1] });
                }
                return acc;
              }, [] as { x: number; y: number }[]),
            },
            effect: {
              type: censorSettings.effect,
              intensity: 50,
              color: censorSettings.solidColor,
              blurRadius: censorSettings.blurRadius,
              pixelSize: censorSettings.pixelSize,
            },
            visible: true,
            opacity: 100,
            blendMode: 'source-over' as GlobalCompositeOperation,
            locked: false,
            order: layers.length,
          };
          
          addLayer(newLayer);
        } else {
          setPaths(prev => [...prev, {
            points: currentPath,
            color: brushSettings.color,
            size: brushSettings.size,
            opacity: brushSettings.opacity / 100,
          }]);
        }
      }
      
      setCurrentPath([]);
    }
  };

  const baseLayer = layers.find(l => l.type === 'base') as BaseImageLayer | undefined;

  const handleZoomIn = useCallback(() => {
    const newScale = Math.min(scale * 1.2, 32);
    setScale(newScale);
    if (stageRef.current) {
      const stage = stageRef.current;
      const center = { x: dimensions.width / 2, y: dimensions.height / 2 };
      const newPos = {
        x: center.x - (canvas.width * newScale) / 2,
        y: center.y - (canvas.height * newScale) / 2,
      };
      stage.position(newPos);
      stage.scale({ x: newScale, y: newScale });
    }
  }, [scale, dimensions, canvas]);

  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(scale * 0.8, 0.1);
    setScale(newScale);
    if (stageRef.current) {
      const stage = stageRef.current;
      const center = { x: dimensions.width / 2, y: dimensions.height / 2 };
      const newPos = {
        x: center.x - (canvas.width * newScale) / 2,
        y: center.y - (canvas.height * newScale) / 2,
      };
      stage.position(newPos);
      stage.scale({ x: newScale, y: newScale });
    }
  }, [scale, dimensions, canvas]);

  const handleFitToScreen = useCallback(() => {
    handleResize();
  }, [handleResize]);

  const handleActualSize = useCallback(() => {
    setScale(1);
    if (stageRef.current) {
      const stage = stageRef.current;
      const center = { x: dimensions.width / 2, y: dimensions.height / 2 };
      const newPos = {
        x: center.x - canvas.width / 2,
        y: center.y - canvas.height / 2,
      };
      stage.position(newPos);
      stage.scale({ x: 1, y: 1 });
    }
  }, [dimensions, canvas]);

  const applyCrop = useCallback(() => {
    if (!cropArea || !stageRef.current) return;

    // Get the base layer
    const baseLayer = layers.find(l => l.type === 'base') as BaseImageLayer;
    if (!baseLayer || !baseLayer.image) return;

    // Create a new canvas with the cropped dimensions
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropArea.width;
    cropCanvas.height = cropArea.height;
    const ctx = cropCanvas.getContext('2d');
    
    if (!ctx) return;

    // Draw the cropped portion of the image
    ctx.drawImage(
      baseLayer.image,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      0, 0, cropArea.width, cropArea.height
    );

    // Create a new image from the cropped canvas
    const croppedImage = new Image();
    croppedImage.onload = () => {
      // Update the base image and canvas dimensions
      const { setCanvas, setBaseImage } = useEditorStore.getState();
      const { setActiveTool } = useToolsStore.getState();
      setCanvas({
        ...canvas,
        width: cropArea.width,
        height: cropArea.height,
      });
      setBaseImage(croppedImage, {
        name: 'Cropped Image',
        size: 0,
      });

      // Reset crop area and tool
      setCropArea(null);
      setActiveTool('select');
      
      // Re-center the stage
      handleResize();
    };
    croppedImage.src = cropCanvas.toDataURL();
  }, [cropArea, layers, canvas, handleResize]);

  const cancelCrop = useCallback(() => {
    const { setActiveTool } = useToolsStore.getState();
    setCropArea(null);
    setActiveTool('select');
  }, []);

  const getCursorStyle = () => {
    switch(activeTool) {
      case 'brush':
        return 'crosshair';
      case 'hand':
        return isPanning ? 'grabbing' : 'grab';
      case 'zoom':
        return 'zoom-in';
      case 'crop':
      case 'censor':
        return 'crosshair';
      case 'select':
        return 'move';
      default:
        return 'default';
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative bg-stone-200 overflow-hidden h-full ${className}`}
      style={{ 
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,.05) 10px, rgba(0,0,0,.05) 20px)',
        cursor: getCursorStyle(),
      }}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        scale={{ x: scale, y: scale }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        draggable={false}
      >
        <KonvaLayer>
          <Rect
            x={0}
            y={0}
            width={canvas.width}
            height={canvas.height}
            fill={canvas.backgroundColor}
          />
        </KonvaLayer>

        {baseLayer?.image && (
          <KonvaLayer>
            <KonvaImage
              image={baseLayer.image}
              x={0}
              y={0}
              width={canvas.width}
              height={canvas.height}
              opacity={baseLayer.opacity / 100}
              visible={baseLayer.visible}
            />
          </KonvaLayer>
        )}

        {layers
          .filter(layer => layer.type !== 'base')
          .sort((a, b) => a.order - b.order)
          .map((layer) => (
            <KonvaLayer
              key={layer.id}
              opacity={layer.opacity / 100}
              visible={layer.visible}
            >
              {/* Paint Layer */}
              {layer.type === 'paint' && layer.id === selectedLayerId && (
                <>
                  {paths.map((path, index) => (
                    <Line
                      key={index}
                      points={path.points}
                      stroke={path.color}
                      strokeWidth={path.size}
                      opacity={path.opacity}
                      lineCap="round"
                      lineJoin="round"
                      tension={0.5}
                      globalCompositeOperation="source-over"
                    />
                  ))}
                  {currentPath.length > 0 && (
                    <Line
                      points={currentPath}
                      stroke={brushSettings.color}
                      strokeWidth={brushSettings.size}
                      opacity={brushSettings.opacity / 100}
                      lineCap="round"
                      lineJoin="round"
                      tension={0.5}
                      globalCompositeOperation="source-over"
                    />
                  )}
                </>
              )}

              {/* Adjustment Layer */}
              {layer.type === 'adjustment' && baseLayer?.image && (
                <KonvaImage
                  image={baseLayer.image}
                  x={0}
                  y={0}
                  width={canvas.width}
                  height={canvas.height}
                  filters={(() => {
                    const filters = [];
                    const adj = layer as AdjustmentLayer;
                    
                    if (adj.parameters.brightness !== 0) {
                      filters.push(Konva.Filters.Brighten);
                    }
                    if (adj.parameters.contrast !== 0) {
                      filters.push(Konva.Filters.Contrast);
                    }
                    if (adj.parameters.saturation !== 0) {
                      filters.push(Konva.Filters.HSL);
                    }
                    
                    return filters;
                  })()}
                  brightness={(layer as AdjustmentLayer).parameters.brightness ? 
                    (layer as AdjustmentLayer).parameters.brightness! / 100 : 0}
                  contrast={(layer as AdjustmentLayer).parameters.contrast || 0}
                  saturation={(layer as AdjustmentLayer).parameters.saturation ? 
                    (layer as AdjustmentLayer).parameters.saturation! / 100 : 0}
                />
              )}

              {/* Censor Layer */}
              {layer.type === 'censor' && (
                <CensorShape
                  layer={layer as CensorLayer}
                  baseImage={baseLayer?.image}
                  canvasWidth={canvas.width}
                  canvasHeight={canvas.height}
                  isSelected={layer.id === selectedLayerId}
                  activeTool={activeTool}
                  onShapeClick={(e) => {
                    e.cancelBubble = true;
                    // Select the layer first
                    const { setSelectedLayer } = useEditorStore.getState();
                    setSelectedLayer(layer.id);
                    // Set the shape ref and immediately attach transformer
                    const shapeNode = e.target;
                    setSelectedShapeRef(shapeNode);
                    if (transformerRef.current && activeTool === 'select') {
                      transformerRef.current.nodes([shapeNode]);
                      transformerRef.current.getLayer().batchDraw();
                    }
                  }}
                  onDragEnd={(e) => {
                    const node = e.target;
                    const isCircle = (layer as CensorLayer).shape?.type === 'circle';
                    
                    if (isCircle) {
                      // For circles, update based on center position
                      const radius = Math.min(
                        (layer as CensorLayer).shape?.bounds?.width || 200,
                        (layer as CensorLayer).shape?.bounds?.height || 200
                      ) / 2;
                      updateLayer(layer.id, {
                        ...layer,
                        shape: {
                          ...(layer as CensorLayer).shape,
                          bounds: {
                            x: node.x(),
                            y: node.y(),
                            width: radius * 2,
                            height: radius * 2,
                          },
                        },
                      } as Partial<Layer>);
                    } else {
                      // For rectangles
                      updateLayer(layer.id, {
                        ...layer,
                        shape: {
                          ...(layer as CensorLayer).shape,
                          bounds: {
                            x: node.x(),
                            y: node.y(),
                            width: (layer as CensorLayer).shape?.bounds?.width || 200,
                            height: (layer as CensorLayer).shape?.bounds?.height || 200,
                          },
                        },
                      } as Partial<Layer>);
                    }
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    
                    // Reset scale to 1
                    node.scaleX(1);
                    node.scaleY(1);
                    
                    if ((layer as CensorLayer).shape?.type === 'circle') {
                      // For circles
                      const newRadius = Math.max(10, Math.min(
                        (layer as CensorLayer).shape?.bounds?.width || 200,
                        (layer as CensorLayer).shape?.bounds?.height || 200
                      ) / 2 * Math.max(scaleX, scaleY));
                      
                      updateLayer(layer.id, {
                        ...layer,
                        shape: {
                          ...(layer as CensorLayer).shape,
                          bounds: {
                            x: node.x(),
                            y: node.y(),
                            width: newRadius * 2,
                            height: newRadius * 2,
                          },
                        },
                      } as Partial<Layer>);
                    } else if ((layer as CensorLayer).shape?.type === 'triangle') {
                      // For triangles
                      const currentBounds = (layer as CensorLayer).shape?.bounds;
                      const newWidth = Math.max(20, (currentBounds?.width || 200) * scaleX);
                      const newHeight = Math.max(20, (currentBounds?.height || 200) * scaleY);
                      
                      updateLayer(layer.id, {
                        ...layer,
                        shape: {
                          ...(layer as CensorLayer).shape,
                          bounds: {
                            x: node.x(),
                            y: node.y(),
                            width: Math.min(newWidth, canvas.width - node.x()),
                            height: Math.min(newHeight, canvas.height - node.y()),
                          },
                        },
                      } as Partial<Layer>);
                    } else {
                      // For rectangles and freeform
                      const currentBounds = (layer as CensorLayer).shape?.bounds;
                      const newWidth = Math.max(20, (currentBounds?.width || 200) * scaleX);
                      const newHeight = Math.max(20, (currentBounds?.height || 200) * scaleY);
                      
                      updateLayer(layer.id, {
                        ...layer,
                        shape: {
                          ...(layer as CensorLayer).shape,
                          bounds: {
                            x: node.x(),
                            y: node.y(),
                            width: Math.min(newWidth, canvas.width - node.x()),
                            height: Math.min(newHeight, canvas.height - node.y()),
                          },
                        },
                      } as Partial<Layer>);
                    }
                  }}
                />
              )}
            </KonvaLayer>
          ))}

        {/* Transformer for selected censor shapes */}
        <KonvaLayer>
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // Limit resize to minimum size
              if (newBox.width < 20 || newBox.height < 20) {
                return oldBox;
              }
              
              // Limit to canvas bounds
              const maxX = canvas.width;
              const maxY = canvas.height;
              
              // Ensure the shape stays within canvas
              if (newBox.x < 0) {
                newBox.width += newBox.x;
                newBox.x = 0;
              }
              if (newBox.y < 0) {
                newBox.height += newBox.y;
                newBox.y = 0;
              }
              if (newBox.x + newBox.width > maxX) {
                newBox.width = maxX - newBox.x;
              }
              if (newBox.y + newBox.height > maxY) {
                newBox.height = maxY - newBox.y;
              }
              
              return newBox;
            }}
            enabledAnchors={[
              'top-left',
              'top-center',
              'top-right',
              'middle-right',
              'middle-left',
              'bottom-left',
              'bottom-center',
              'bottom-right',
            ]}
            anchorSize={8}
            anchorCornerRadius={2}
            anchorStroke={'#3b82f6'}
            anchorFill={'white'}
            anchorStrokeWidth={2}
            borderStroke={'#3b82f6'}
            borderStrokeWidth={2}
            borderDash={[3, 3]}
            rotateEnabled={false}
            keepRatio={false}
          />
        </KonvaLayer>

        {/* Grid Overlay */}
        {showGrid && (
          <KonvaLayer listening={false}>
            {Array.from({ length: Math.ceil(canvas.width / 50) }).map((_, i) => (
              <Line
                key={`v-${i}`}
                points={[i * 50, 0, i * 50, canvas.height]}
                stroke="rgba(0,0,0,0.1)"
                strokeWidth={1}
              />
            ))}
            {Array.from({ length: Math.ceil(canvas.height / 50) }).map((_, i) => (
              <Line
                key={`h-${i}`}
                points={[0, i * 50, canvas.width, i * 50]}
                stroke="rgba(0,0,0,0.1)"
                strokeWidth={1}
              />
            ))}
          </KonvaLayer>
        )}

        {/* Selection Overlay */}
        <KonvaLayer listening={false}>
          {/* Active selection drawing */}
          {isSelecting && selectionStart && selectionEnd && (
            <>
              {(activeTool === 'crop' || (activeTool === 'censor' && censorSettings.shape === 'rectangle')) && (
                <Rect
                  x={Math.min(selectionStart.x, selectionEnd.x)}
                  y={Math.min(selectionStart.y, selectionEnd.y)}
                  width={Math.abs(selectionEnd.x - selectionStart.x)}
                  height={Math.abs(selectionEnd.y - selectionStart.y)}
                  stroke={
                    activeTool === 'crop' ? '#4ade80' : 
                    activeTool === 'censor' ? '#ef4444' : 
                    '#3b82f6'
                  }
                  strokeWidth={2 / scale}
                  dash={[10 / scale, 5 / scale]}
                  fill={activeTool === 'censor' ? 
                    censorSettings.effect === 'blur' ? 'rgba(59, 130, 246, 0.2)' :
                    censorSettings.effect === 'pixelate' ? 'rgba(245, 158, 11, 0.2)' :
                    `${censorSettings.solidColor}33` : 'transparent'}
                />
              )}
              {(activeTool === 'censor' && censorSettings.shape === 'circle') && (
                <Circle
                  x={(selectionStart.x + selectionEnd.x) / 2}
                  y={(selectionStart.y + selectionEnd.y) / 2}
                  radius={Math.min(
                    Math.abs(selectionEnd.x - selectionStart.x),
                    Math.abs(selectionEnd.y - selectionStart.y)
                  ) / 2}
                  stroke="#ef4444"
                  strokeWidth={2 / scale}
                  dash={[10 / scale, 5 / scale]}
                  fill={
                    censorSettings.effect === 'blur' ? 'rgba(59, 130, 246, 0.2)' :
                    censorSettings.effect === 'pixelate' ? 'rgba(245, 158, 11, 0.2)' :
                    `${censorSettings.solidColor}33`
                  }
                />
              )}
              {(activeTool === 'censor' && censorSettings.shape === 'triangle') && (
                <Line
                  points={[
                    (selectionStart.x + selectionEnd.x) / 2, Math.min(selectionStart.y, selectionEnd.y), // Top
                    Math.min(selectionStart.x, selectionEnd.x), Math.max(selectionStart.y, selectionEnd.y), // Bottom left
                    Math.max(selectionStart.x, selectionEnd.x), Math.max(selectionStart.y, selectionEnd.y), // Bottom right
                  ]}
                  closed={true}
                  stroke="#ef4444"
                  strokeWidth={2 / scale}
                  dash={[10 / scale, 5 / scale]}
                  fill={
                    censorSettings.effect === 'blur' ? 'rgba(59, 130, 246, 0.2)' :
                    censorSettings.effect === 'pixelate' ? 'rgba(245, 158, 11, 0.2)' :
                    `${censorSettings.solidColor}33`
                  }
                />
              )}
            </>
          )}

          {/* Freeform censor preview while drawing */}
          {isDrawing.current && activeTool === 'censor' && censorSettings.shape === 'freeform' && currentPath.length > 2 && (
            <Line
              points={currentPath}
              stroke="#ef4444"
              strokeWidth={2 / scale}
              dash={[10 / scale, 5 / scale]}
              fill={
                censorSettings.effect === 'blur' ? 'rgba(59, 130, 246, 0.2)' :
                censorSettings.effect === 'pixelate' ? 'rgba(245, 158, 11, 0.2)' :
                `${censorSettings.solidColor}33`
              }
              closed={false}
            />
          )}


          {/* Crop area */}
          {cropArea && (
            <>
              {/* Crop confirmation buttons */}
              <Group x={cropArea.x + cropArea.width - 100 / scale} y={cropArea.y - 40 / scale}>
                <Rect
                  width={45 / scale}
                  height={30 / scale}
                  fill="#4ade80"
                  cornerRadius={4 / scale}
                  onClick={() => applyCrop()}
                  onTap={() => applyCrop()}
                />
                <Text
                  text="✓"
                  fontSize={20 / scale}
                  fill="white"
                  width={45 / scale}
                  height={30 / scale}
                  align="center"
                  verticalAlign="middle"
                />
                
                <Rect
                  x={50 / scale}
                  width={45 / scale}
                  height={30 / scale}
                  fill="#ef4444"
                  cornerRadius={4 / scale}
                  onClick={() => cancelCrop()}
                  onTap={() => cancelCrop()}
                />
                <Text
                  x={50 / scale}
                  text="✕"
                  fontSize={20 / scale}
                  fill="white"
                  width={45 / scale}
                  height={30 / scale}
                  align="center"
                  verticalAlign="middle"
                />
              </Group>
              {/* Darkened overlay outside crop area */}
              <Rect
                x={0}
                y={0}
                width={canvas.width}
                height={cropArea.y}
                fill="rgba(0,0,0,0.5)"
              />
              <Rect
                x={0}
                y={cropArea.y + cropArea.height}
                width={canvas.width}
                height={canvas.height - cropArea.y - cropArea.height}
                fill="rgba(0,0,0,0.5)"
              />
              <Rect
                x={0}
                y={cropArea.y}
                width={cropArea.x}
                height={cropArea.height}
                fill="rgba(0,0,0,0.5)"
              />
              <Rect
                x={cropArea.x + cropArea.width}
                y={cropArea.y}
                width={canvas.width - cropArea.x - cropArea.width}
                height={cropArea.height}
                fill="rgba(0,0,0,0.5)"
              />
              
              {/* Crop border */}
              <Rect
                x={cropArea.x}
                y={cropArea.y}
                width={cropArea.width}
                height={cropArea.height}
                stroke="#4ade80"
                strokeWidth={2 / scale}
                fill="transparent"
              />
              
              {/* Rule of thirds guides */}
              <Line
                points={[
                  cropArea.x + cropArea.width / 3,
                  cropArea.y,
                  cropArea.x + cropArea.width / 3,
                  cropArea.y + cropArea.height,
                ]}
                stroke="#4ade80"
                strokeWidth={1 / scale}
                opacity={0.5}
              />
              <Line
                points={[
                  cropArea.x + (cropArea.width * 2) / 3,
                  cropArea.y,
                  cropArea.x + (cropArea.width * 2) / 3,
                  cropArea.y + cropArea.height,
                ]}
                stroke="#4ade80"
                strokeWidth={1 / scale}
                opacity={0.5}
              />
              <Line
                points={[
                  cropArea.x,
                  cropArea.y + cropArea.height / 3,
                  cropArea.x + cropArea.width,
                  cropArea.y + cropArea.height / 3,
                ]}
                stroke="#4ade80"
                strokeWidth={1 / scale}
                opacity={0.5}
              />
              <Line
                points={[
                  cropArea.x,
                  cropArea.y + (cropArea.height * 2) / 3,
                  cropArea.x + cropArea.width,
                  cropArea.y + (cropArea.height * 2) / 3,
                ]}
                stroke="#4ade80"
                strokeWidth={1 / scale}
                opacity={0.5}
              />
              
              {/* Resize handles */}
              {/* Top-left */}
              <Rect
                x={cropArea.x - 6 / scale}
                y={cropArea.y - 6 / scale}
                width={12 / scale}
                height={12 / scale}
                fill="white"
                stroke="#4ade80"
                strokeWidth={2 / scale}
                onMouseDown={(e) => {
                  e.cancelBubble = true;
                  setDraggingCropHandle('tl');
                  setCropStartPos({ x: e.evt.clientX, y: e.evt.clientY });
                  setInitialCropArea({ ...cropArea });
                }}
                onMouseEnter={() => document.body.style.cursor = 'nwse-resize'}
                onMouseLeave={() => document.body.style.cursor = getCursorStyle()}
              />
              
              {/* Top-right */}
              <Rect
                x={cropArea.x + cropArea.width - 6 / scale}
                y={cropArea.y - 6 / scale}
                width={12 / scale}
                height={12 / scale}
                fill="white"
                stroke="#4ade80"
                strokeWidth={2 / scale}
                onMouseDown={(e) => {
                  e.cancelBubble = true;
                  setDraggingCropHandle('tr');
                  setCropStartPos({ x: e.evt.clientX, y: e.evt.clientY });
                  setInitialCropArea({ ...cropArea });
                }}
                onMouseEnter={() => document.body.style.cursor = 'nesw-resize'}
                onMouseLeave={() => document.body.style.cursor = getCursorStyle()}
              />
              
              {/* Bottom-left */}
              <Rect
                x={cropArea.x - 6 / scale}
                y={cropArea.y + cropArea.height - 6 / scale}
                width={12 / scale}
                height={12 / scale}
                fill="white"
                stroke="#4ade80"
                strokeWidth={2 / scale}
                onMouseDown={(e) => {
                  e.cancelBubble = true;
                  setDraggingCropHandle('bl');
                  setCropStartPos({ x: e.evt.clientX, y: e.evt.clientY });
                  setInitialCropArea({ ...cropArea });
                }}
                onMouseEnter={() => document.body.style.cursor = 'nesw-resize'}
                onMouseLeave={() => document.body.style.cursor = getCursorStyle()}
              />
              
              {/* Bottom-right */}
              <Rect
                x={cropArea.x + cropArea.width - 6 / scale}
                y={cropArea.y + cropArea.height - 6 / scale}
                width={12 / scale}
                height={12 / scale}
                fill="white"
                stroke="#4ade80"
                strokeWidth={2 / scale}
                onMouseDown={(e) => {
                  e.cancelBubble = true;
                  setDraggingCropHandle('br');
                  setCropStartPos({ x: e.evt.clientX, y: e.evt.clientY });
                  setInitialCropArea({ ...cropArea });
                }}
                onMouseEnter={() => document.body.style.cursor = 'nwse-resize'}
                onMouseLeave={() => document.body.style.cursor = getCursorStyle()}
              />
              
              {/* Edge handles for free crop */}
              {(!cropRatio || cropRatio === 'free' || cropRatio === '') && (
                <>
                  {/* Top */}
                  <Rect
                    x={cropArea.x + cropArea.width / 2 - 6 / scale}
                    y={cropArea.y - 6 / scale}
                    width={12 / scale}
                    height={12 / scale}
                    fill="white"
                    stroke="#4ade80"
                    strokeWidth={2 / scale}
                    onMouseDown={(e) => {
                      e.cancelBubble = true;
                      setDraggingCropHandle('t');
                      setCropStartPos({ x: e.evt.clientX, y: e.evt.clientY });
                      setInitialCropArea({ ...cropArea });
                    }}
                    onMouseEnter={() => document.body.style.cursor = 'ns-resize'}
                    onMouseLeave={() => document.body.style.cursor = getCursorStyle()}
                  />
                  
                  {/* Bottom */}
                  <Rect
                    x={cropArea.x + cropArea.width / 2 - 6 / scale}
                    y={cropArea.y + cropArea.height - 6 / scale}
                    width={12 / scale}
                    height={12 / scale}
                    fill="white"
                    stroke="#4ade80"
                    strokeWidth={2 / scale}
                    onMouseDown={(e) => {
                      e.cancelBubble = true;
                      setDraggingCropHandle('b');
                      setCropStartPos({ x: e.evt.clientX, y: e.evt.clientY });
                      setInitialCropArea({ ...cropArea });
                    }}
                    onMouseEnter={() => document.body.style.cursor = 'ns-resize'}
                    onMouseLeave={() => document.body.style.cursor = getCursorStyle()}
                  />
                  
                  {/* Left */}
                  <Rect
                    x={cropArea.x - 6 / scale}
                    y={cropArea.y + cropArea.height / 2 - 6 / scale}
                    width={12 / scale}
                    height={12 / scale}
                    fill="white"
                    stroke="#4ade80"
                    strokeWidth={2 / scale}
                    onMouseDown={(e) => {
                      e.cancelBubble = true;
                      setDraggingCropHandle('l');
                      setCropStartPos({ x: e.evt.clientX, y: e.evt.clientY });
                      setInitialCropArea({ ...cropArea });
                    }}
                    onMouseEnter={() => document.body.style.cursor = 'ew-resize'}
                    onMouseLeave={() => document.body.style.cursor = getCursorStyle()}
                  />
                  
                  {/* Right */}
                  <Rect
                    x={cropArea.x + cropArea.width - 6 / scale}
                    y={cropArea.y + cropArea.height / 2 - 6 / scale}
                    width={12 / scale}
                    height={12 / scale}
                    fill="white"
                    stroke="#4ade80"
                    strokeWidth={2 / scale}
                    onMouseDown={(e) => {
                      e.cancelBubble = true;
                      setDraggingCropHandle('r');
                      setCropStartPos({ x: e.evt.clientX, y: e.evt.clientY });
                      setInitialCropArea({ ...cropArea });
                    }}
                    onMouseEnter={() => document.body.style.cursor = 'ew-resize'}
                    onMouseLeave={() => document.body.style.cursor = getCursorStyle()}
                  />
                </>
              )}
            </>
          )}

          {/* Guide lines */}
          {guides.map((guide, index) => (
            <Line
              key={index}
              points={
                guide.type === 'horizontal'
                  ? [0, guide.position, canvas.width, guide.position]
                  : [guide.position, 0, guide.position, canvas.height]
              }
              stroke="#ef4444"
              strokeWidth={1 / scale}
              dash={[5 / scale, 5 / scale]}
            />
          ))}
        </KonvaLayer>
      </Stage>

      <ViewportControls
        scale={scale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitToScreen={handleFitToScreen}
        onActualSize={handleActualSize}
      />
    </div>
  );
}