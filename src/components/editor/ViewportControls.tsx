'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ViewportControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onActualSize: () => void;
}

export default function ViewportControls({
  scale,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onActualSize,
}: ViewportControlsProps) {
  return (
    <TooltipProvider>
      <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-white/95 backdrop-blur rounded-md shadow-md p-1.5 border border-stone-200">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={onZoomOut}
              className="h-7 w-7 p-0"
            >
              <span className="material-symbols-rounded text-[18px]">remove</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Zoom Out</p>
          </TooltipContent>
        </Tooltip>

        <div className="px-2 text-xs font-medium text-stone-700 min-w-[50px] text-center">
          {Math.round(scale * 100)}%
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={onZoomIn}
              className="h-7 w-7 p-0"
            >
              <span className="material-symbols-rounded text-[18px]">add</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Zoom In</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-4 bg-stone-300 mx-0.5" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={onFitToScreen}
              className="h-7 w-7 p-0"
            >
              <span className="material-symbols-rounded text-[18px]">fit_screen</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Fit to Screen</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={onActualSize}
              className="h-7 px-2"
            >
              <span className="text-xs font-medium">100%</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Actual Size</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}