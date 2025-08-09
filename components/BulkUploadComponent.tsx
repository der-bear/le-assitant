import React, { useState, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react';

interface BulkUploadComponentProps {
  onUpload: (file: File) => void;
  onCancel?: () => void;
  isCompleted?: boolean;
}

export function BulkUploadComponent({ onUpload, onCancel, isCompleted = false }: BulkUploadComponentProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): string | null => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      return 'Please select an Excel file (.xlsx, .xls, or .csv)';
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return 'File size must be less than 10MB';
    }
    return null;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError('');

    const file = e.dataTransfer.files[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  const handleDownloadTemplate = () => {
    // Create a simple CSV template
    const csvContent = "Company Name,Email Address,Phone Number,Notes\nExample Corp,admin@example.com,555-1234,Sample client";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'client_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (isCompleted) {
    return (
      <Card className="p-4 max-w-lg">
        <div className="text-center py-4">
          <CheckCircle className="w-8 h-8 mx-auto text-green-600 mb-2" />
          <p className="text-sm font-normal text-muted-foreground">
            File processed successfully
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 max-w-lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Upload Client File</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
            className="text-xs font-normal"
          >
            <Download className="w-3 h-3 mr-1" />
            Template
          </Button>
        </div>

        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : selectedFile
              ? 'border-green-500 bg-green-50'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {selectedFile ? (
            <div className="space-y-2">
              <CheckCircle className="w-8 h-8 mx-auto text-green-600" />
              <div>
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs font-normal text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Badge variant="secondary" className="text-xs font-normal">
                Ready to upload
              </Badge>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Drop your Excel file here</p>
                <p className="text-xs font-normal text-muted-foreground">
                  or click to browse files
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-normal">
                .xlsx, .xls, .csv
              </Badge>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-normal">{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile}
            className="flex-1 text-sm font-medium"
          >
            <Upload className="w-3 h-3 mr-2" />
            Upload & Process
          </Button>
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="text-sm font-normal"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}