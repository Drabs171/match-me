import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import './FileUpload.css';

export default function FileUpload({ onFileAccepted, isLoading = false }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError('');
    if (rejectedFiles.length > 0) {
      setError('Please upload a PDF or DOCX file');
      return;
    }
    if (acceptedFiles.length > 0) {
      const f = acceptedFiles[0];
      setFile(f);
      onFileAccepted?.(f);
    }
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isLoading,
  });

  const removeFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setError('');
  };

  return (
    <div className="file-upload-wrapper" id="file-upload">
      <div
        {...getRootProps()}
        className={`file-upload-zone ${isDragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''} ${isLoading ? 'is-loading' : ''}`}
      >
        <input {...getInputProps()} />

        {isLoading ? (
          <div className="file-upload-loading">
            <Loader2 size={32} className="spinning" />
            <p>Analyzing your resume...</p>
            <span className="file-upload-hint">Extracting your skills and experience...</span>
          </div>
        ) : file ? (
          <div className="file-upload-preview">
            <FileText size={28} className="file-icon" />
            <div className="file-upload-details">
              <span className="file-name">{file.name}</span>
              <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
            <button className="file-remove" onClick={removeFile} aria-label="Remove file">
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="file-upload-prompt">
            <div className="file-upload-icon-wrapper">
              <Upload size={28} />
            </div>
            <p>{isDragActive ? 'Drop your CV here...' : 'Drag & drop your CV here'}</p>
            <span className="file-upload-hint">or click to browse · PDF or DOCX</span>
          </div>
        )}
      </div>
      {error && <p className="file-upload-error">{error}</p>}
    </div>
  );
}
