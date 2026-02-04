'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PhotoUploadProps {
  value?: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
  label?: string;
  description?: string;
}

export function PhotoUpload({
  value = [],
  onChange,
  maxPhotos = 5,
  disabled = false,
  label = 'صور التسليم',
  description = 'أضف صور إثبات التسليم',
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const newPhotos: string[] = [];

      for (let i = 0; i < files.length && value.length + newPhotos.length < maxPhotos; i++) {
        const file = files[i];

        // Convert to base64 for preview (in production, upload to server)
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        newPhotos.push(base64);
      }

      onChange([...value, ...newPhotos]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (index: number) => {
    const newPhotos = value.filter((_, i) => i !== index);
    onChange(newPhotos);
  };

  const canAddMore = value.length < maxPhotos;

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-medium">{label}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {/* Photos Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((photo, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden border bg-muted"
            >
              <Image
                src={photo}
                alt={`صورة ${index + 1}`}
                fill
                sizes="(max-width: 768px) 33vw, 200px"
                className="object-cover"
                unoptimized
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {canAddMore && !disabled && (
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isUploading}
          />

          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            className="flex-1"
          >
            {isUploading ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="ml-2 h-4 w-4" />
            )}
            رفع صورة
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              // In production, this would open the camera
              fileInputRef.current?.click();
            }}
            disabled={disabled || isUploading}
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Counter */}
      <p className="text-xs text-muted-foreground text-center">
        {value.length} / {maxPhotos} صور
      </p>
    </div>
  );
}

export default PhotoUpload;
