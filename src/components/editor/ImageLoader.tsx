'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useEditorStore } from '@/store/editor-store';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function ImageLoader() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setBaseImage, setLoading, layers } = useEditorStore();

  const hasBaseImage = layers.some(l => l.type === 'base');

  const validateFile = (file: File): string | null => {
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      return `Unsupported file format. Please use: JPEG, PNG, WebP, GIF, or BMP`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 50MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
    }
    return null;
  };

  const loadImage = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setBaseImage(img, {
          name: file.name,
          size: file.size,
        });
        setLoading(false);
      };
      img.onerror = () => {
        setError('Failed to load image');
        setLoading(false);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setError('Failed to read file');
      setLoading(false);
    };
    reader.readAsDataURL(file);
  }, [setBaseImage, setLoading]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadImage(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      loadImage(file);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  if (hasBaseImage) return null;

  return (
    <>
      <div
        className={`absolute inset-0 flex items-center justify-center transition-colors ${
          isDragging ? 'bg-stone-300/50' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="mb-6">
            <span className="material-symbols-rounded text-6xl text-stone-400">
              add_photo_alternate
            </span>
          </div>
          
          <h2 className="text-2xl font-semibold text-stone-900 mb-2">
            Load an Image
          </h2>
          
          <p className="text-stone-600 mb-6">
            Drag and drop an image here, or click to browse
          </p>

          <Button
            onClick={openFilePicker}
            className="bg-stone-900 hover:bg-stone-800 text-white"
          >
            <span className="material-symbols-rounded mr-2 text-lg">
              upload_file
            </span>
            Choose File
          </Button>

          <p className="text-xs text-stone-500 mt-4">
            Supported formats: JPEG, PNG, WebP, GIF, BMP (max 50MB)
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept={SUPPORTED_FORMATS.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      <Dialog open={!!error} onOpenChange={() => setError(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error Loading Image</DialogTitle>
            <DialogDescription>{error}</DialogDescription>
          </DialogHeader>
          <Button onClick={() => setError(null)}>OK</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}