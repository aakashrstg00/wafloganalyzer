import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import './FileUpload.css';

const FileUpload = ({ onFileUpload }) => {
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState(null);
    const inputRef = useRef(null);

    const handleFiles = (files) => {
        setError(null);
        if (files && files[0]) {
            const file = files[0];
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    // Parse NDJSON
                    const lines = text.trim().split('\n');
                    const logs = lines.map((line, index) => {
                        try {
                            return JSON.parse(line);
                        } catch (err) {
                            console.warn(`Failed to parse line ${index + 1}`);
                            return null;
                        }
                    }).filter(Boolean);

                    if (logs.length === 0) {
                        setError("No valid JSON logs found in file.");
                        return;
                    }

                    onFileUpload(logs, file.name);
                } catch (err) {
                    setError("Error reading file.");
                }
            };

            reader.readAsText(file);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files);
        }
    };

    const onButtonClick = () => {
        inputRef.current.click();
    };

    return (
        <div className="upload-container">
            <div
                className={`upload-area ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={inputRef}
                    type="file"
                    className="upload-input"
                    onChange={handleChange}
                    accept=".json,.log,.txt"
                />
                <div className="upload-content">
                    <div className="icon-wrapper">
                        <Upload size={48} className="upload-icon" />
                    </div>
                    <h3 className="upload-title">Upload Log File</h3>
                    <p className="upload-subtitle">Drag & drop your WAF log files here or click to browse</p>
                    <button className="btn btn-primary" onClick={onButtonClick}>
                        Select File
                    </button>
                </div>
            </div>
            {error && (
                <div className="error-message animate-fade-in">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
};

export default FileUpload;
