import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Image, 
  Video, 
  File, 
  Upload, 
  X, 
  Camera, 
  Mic,
  FileText,
  Download
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MediaFile {
  id: string;
  file: File;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  uploadProgress?: number;
}

interface MediaUploadProps {
  onFilesChange: (files: MediaFile[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  showPreview?: boolean;
}

const MediaUpload: React.FC<MediaUploadProps> = ({
  onFilesChange,
  maxFiles = 5,
  acceptedTypes = ['image/*', 'video/*', 'audio/*', '.pdf', '.doc', '.docx', '.txt'],
  maxSize = 10, // 10MB default
  showPreview = true
}) => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileType = (file: File): 'image' | 'video' | 'audio' | 'document' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'audio': return <Mic className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `${file.name} is larger than ${maxSize}MB`,
        variant: "destructive",
      });
      return false;
    }

    // Check file type
    const isAccepted = acceptedTypes.some(type => {
      if (type.includes('*')) {
        return file.type.startsWith(type.replace('*', ''));
      }
      return file.name.toLowerCase().endsWith(type) || file.type === type;
    });

    if (!isAccepted) {
      toast({
        title: "File type not supported",
        description: `${file.name} is not a supported file type`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFiles = (newFiles: FileList) => {
    const validFiles: MediaFile[] = [];
    
    Array.from(newFiles).forEach((file, index) => {
      if (files.length + validFiles.length >= maxFiles) {
        toast({
          title: "Too many files",
          description: `Maximum ${maxFiles} files allowed`,
          variant: "destructive",
        });
        return;
      }

      if (validateFile(file)) {
        const mediaFile: MediaFile = {
          id: `${Date.now()}_${index}`,
          file,
          type: getFileType(file),
          url: URL.createObjectURL(file),
          uploadProgress: 0
        };
        validFiles.push(mediaFile);
        
        // Simulate upload progress
        simulateUpload(mediaFile.id);
      }
    });

    const updatedFiles = [...files, ...validFiles];
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, uploadProgress: progress } : f
      ));
    }, 200);
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    
    // Clean up object URLs
    const fileToRemove = files.find(f => f.id === fileId);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.url);
    }
    
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card className={`transition-smooth ${isDragging ? 'border-primary bg-primary/5' : 'border-dashed border-muted-foreground/30'}`}>
        <CardContent
          className="p-6 text-center cursor-pointer"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="space-y-2">
            <Upload className={`h-8 w-8 mx-auto ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
            <div>
              <p className="text-sm font-medium">
                {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-muted-foreground">
                Max {maxFiles} files, {maxSize}MB each
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((mediaFile) => (
            <Card key={mediaFile.id} className="card-gradient">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {/* File Preview */}
                  {showPreview && mediaFile.type === 'image' ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img 
                        src={mediaFile.url} 
                        alt={mediaFile.file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      {getFileIcon(mediaFile.type)}
                    </div>
                  )}

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">{mediaFile.file.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {mediaFile.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(mediaFile.file.size)}
                    </p>
                    
                    {/* Upload Progress */}
                    {mediaFile.uploadProgress !== undefined && mediaFile.uploadProgress < 100 && (
                      <div className="mt-2">
                        <Progress value={mediaFile.uploadProgress} className="h-1" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Uploading... {Math.round(mediaFile.uploadProgress)}%
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {mediaFile.uploadProgress === 100 && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFile(mediaFile.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {files.length === 0 && (
        <div className="flex gap-2 justify-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = 'image/*';
                fileInputRef.current.click();
              }
            }}
          >
            <Camera className="h-4 w-4 mr-2" />
            Photo
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = 'video/*';
                fileInputRef.current.click();
              }
            }}
          >
            <Video className="h-4 w-4 mr-2" />
            Video
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = '.pdf,.doc,.docx,.txt';
                fileInputRef.current.click();
              }
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            Document
          </Button>
        </div>
      )}
    </div>
  );
};

export default MediaUpload;