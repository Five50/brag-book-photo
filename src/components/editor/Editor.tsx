'use client';

import React from 'react';
import Canvas from './Canvas';
import ImageLoader from './ImageLoader';
import LayersPanel from './LayersPanel';
import ToolPalette from './ToolPalette';
import { useEditorStore } from '@/store/editor-store';

export default function Editor() {
  const { isLoading } = useEditorStore();

  return (
    <div className="h-screen w-screen flex flex-col bg-stone-100">
      <header className="h-12 bg-white border-b border-stone-200 flex items-center px-4">
        <h1 className="text-lg font-semibold text-stone-900">Photo Editor</h1>
      </header>

      <div className="flex-1 flex">
        <ToolPalette />
        <div className="flex-1 relative">
          <Canvas className="absolute inset-0" />
          <ImageLoader />
          
          {isLoading && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="bg-white rounded-lg p-4 shadow-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
              </div>
            </div>
          )}
        </div>
        
        <LayersPanel />
      </div>
    </div>
  );
}