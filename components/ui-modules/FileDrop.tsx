import React, { useState, useRef, useCallback } from 'react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { HelpCircle, Upload, X, File, CheckCircle, AlertCircle, RotateCcw, Download } from 'lucide-react';

type UploadFile = {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  result?: any;
};

type Action = { 
  id: string; 
  label: string; 
  variant?: 'default' | 'secondary' | 'ghost'; 
  disabled?: boolean; 
};

type FileDropModule = {
  id?: string;
  title?: string;
  description?: string;
  helpUrl?: string;
  loading?: boolean;
  error?: string;
  empty?: string;
  actions?: Action[];
  kind: 'filedrop';
  accept?: string;
  multiple?: boolean;
  maxSizeMb?: number;
  note?: string;
  templateUrl?: string; // New: URL for template download
  templateLabel?: string; // New: Label for template button
};

interface FileDropProps extends FileDropModule {
  onAction?: (actionId: string, data?: any) => void;
  onUploadStart?: (files: File[]) => void;
  onUploadProgress?: (fileId: string, progress: number) => void;
  onUploadComplete?: (fileId: string, result: any) => void;
  onUploadError?: (fileId: string, error: string) => void;
}

export function FileDrop({
  id,
  title = "Upload Client File",
  description,
  helpUrl,
  loading = false,
  error,
  empty,
  actions = [],
  accept = ".xlsx,.xls,.csv",
  multiple = false,
  maxSizeMb = 10,
  note,
  templateUrl,
  templateLabel = "Template",
  onAction,
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError
}: FileDropProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
      return `File size exceeds ${maxSizeMb}MB limit`;
    }

    if (accept) {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const mimeType = file.type;
      
      const isAccepted = acceptedTypes.some(acceptType => {
        if (acceptType.startsWith('.')) {
          return fileExtension === acceptType.toLowerCase();
        }
        return mimeType.match(acceptType.replace('*', '.*'));
      });

      if (!isAccepted) {
        return `File type not accepted. Allowed: ${accept}`;
      }
    }

    return null;
  }, [accept, maxSizeMb]);

  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles: UploadFile[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const error = validateFile(file);
      
      const uploadFile: UploadFile = {
        id: `${Date.now()}_${i}`,
        file,
        status: error ? 'error' : 'pending',
        progress: 0,
        error
      };
      
      newFiles.push(uploadFile);
    }

    setFiles(prev => multiple ? [...prev, ...newFiles] : newFiles);

    // Start upload for valid files
    const validFiles = newFiles.filter(f => f.status === 'pending').map(f => f.file);
    if (validFiles.length > 0 && onUploadStart) {
      onUploadStart(validFiles);
    }
  }, [multiple, validateFile, onUploadStart]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (loading) return;
    
    const fileList = e.dataTransfer.files;
    if (fileList.length > 0) {
      handleFiles(fileList);
    }
  }, [loading, handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!loading) {
      setIsDragging(true);
    }
  }, [loading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      handleFiles(fileList);
    }
    // Clear input to allow same file selection
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  const handleBrowse = useCallback(() => {
    if (!loading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [loading]);

  const handleTemplateDownload = useCallback(() => {
    if (templateUrl) {
      window.open(templateUrl, '_blank');
    }
    onAction?.('template-download');
  }, [templateUrl, onAction]);

  const handleUploadAndProcess = useCallback(() => {
    onAction?.('upload-process', { files: files.filter(f => f.status === 'success' || f.status === 'pending') });
  }, [files, onAction]);

  const handleCancel = useCallback(() => {
    setFiles([]);
    onAction?.('cancel');
  }, [onAction]);

  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const handleRetryFile = useCallback((fileId: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'pending', progress: 0, error: undefined } : f
    ));
    
    const file = files.find(f => f.id === fileId);
    if (file && onUploadStart) {
      onUploadStart([file.file]);
    }
  }, [files, onUploadStart]);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const getStatusIcon = useCallback((status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'uploading':
        return <Upload className="w-4 h-4 text-blue-600 animate-pulse" />;
      default:
        return <File className="w-4 h-4 text-muted-foreground" />;
    }
  }, []);

  const hasFiles = files.length > 0;
  const hasValidFiles = files.some(f => f.status === 'success' || f.status === 'pending');
  const hasErrors = files.some(f => f.status === 'error');

  // Format file extensions for display
  const formatAcceptedTypes = useCallback((acceptString: string) => {
    return acceptString.split(',').map(type => type.trim()).join(', ');
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{title}</h3>
              {helpUrl && (
                <Button variant="ghost" size="sm" asChild className="h-4 w-4 p-0">
                  <a href={helpUrl} target="_blank" rel="noopener noreferrer">
                    <HelpCircle className="h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onClick={handleBrowse}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer bg-card ${
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-muted-foreground/50 hover:bg-muted/20'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
          disabled={loading}
        />

        <div className="space-y-3">
          {/* Upload Icon */}
          <div className="flex justify-center">
            <Upload className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
          </div>
          
          {/* Main Message */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {isDragging ? 'Drop files here' : 'Upload files'}
            </p>
            <p className="text-xs text-muted-foreground">
              Drag and drop or click to browse
            </p>
          </div>
          
          {/* File Format Info */}
          {(accept || maxSizeMb) && (
            <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
              {accept && (
                <span>{formatAcceptedTypes(accept)}</span>
              )}
              {accept && maxSizeMb && <span>•</span>}
              {maxSizeMb && (
                <span>Max {maxSizeMb}MB</span>
              )}
            </div>
          )}
          
          {/* Additional Note */}
          {note && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">{note}</p>
            </div>
          )}
        </div>
      </div>

      {/* Template Download */}
      {templateUrl && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTemplateDownload}
            className="h-8 px-4 text-sm gap-2"
            type="button"
          >
            <Download className="w-4 h-4" />
            {templateLabel}
          </Button>
        </div>
      )}

      {/* Files List */}
      {hasFiles && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Files ({files.length})</h4>
            {hasErrors && (
              <Badge variant="destructive" className="text-xs">
                {files.filter(f => f.status === 'error').length} failed
              </Badge>
            )}
          </div>
          
          <div className="space-y-2">
            {files.map((uploadFile) => (
              <div key={uploadFile.id} className="border rounded-md p-3 space-y-2 bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {getStatusIcon(uploadFile.status)}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {uploadFile.file.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatFileSize(uploadFile.file.size)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {uploadFile.status === 'error' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRetryFile(uploadFile.id)}
                        className="h-7 w-7 p-0"
                        title="Retry"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(uploadFile.id)}
                      className="h-7 w-7 p-0"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                {uploadFile.status === 'uploading' && (
                  <Progress value={uploadFile.progress} className="h-1" />
                )}
                
                {uploadFile.error && (
                  <p className="text-xs text-destructive">{uploadFile.error}</p>
                )}
                
                {uploadFile.status === 'success' && uploadFile.result && (
                  <div className="text-xs text-green-600">
                    Upload complete
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {hasFiles && (
        <div className="flex items-center gap-2">
          <Button
            onClick={handleUploadAndProcess}
            disabled={loading || !hasValidFiles}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload & Process
          </Button>
          
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Custom Actions */}
      {actions.length > 0 && (
        <div className="flex items-center gap-2">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || 'outline'}
              disabled={loading || action.disabled}
              onClick={() => onAction?.(action.id)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}