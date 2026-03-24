import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { uploadProjections } from '../services/api';
import { UploadCloud, File as FileIcon, CheckCircle, AlertCircle, Save, RefreshCw } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const ScoringSettingsEditor = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/v1/settings/scoring`);
      setSettings(res.data);
    } catch (err) {
      console.error("Failed to load scoring settings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (type, key, val) => {
    setSettings(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [key]: parseFloat(val)
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await axios.post(`${API_BASE_URL}/api/v1/settings/scoring`, settings);
      setMessage({ type: 'success', text: 'Settings saved! Points will recalculate shortly.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-4 text-gray-500">Loading settings...</div>;

  const renderInputs = (type, title) => (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <h3 className="font-bold text-gray-700 mb-3 uppercase text-xs">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Object.entries(settings[type]).map(([key, val]) => (
          <div key={key} className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1 font-semibold">{key}</label>
            <input
              type="number"
              step="0.1"
              value={val}
              onChange={(e) => handleChange(type, key, e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Scoring Settings</h2>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold transition-colors disabled:opacity-50">
          {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          Save Changes
        </button>
      </div>
      {message && (
        <div className={`mb-4 p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
      <div className="space-y-4">
        {renderInputs('hitter', 'Batter Points')}
        {renderInputs('pitcher', 'Pitcher Points')}
      </div>
    </div>
  );
};

const Uploader = ({ playerType, title }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ message: '', type: '' });

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setUploadStatus({ message: '', type: '' });
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setUploadStatus({ message: 'Please select a file first.', type: 'error' });
      return;
    }

    setIsUploading(true);
    setUploadStatus({ message: '', type: '' });

    try {
      // The api service now needs the playerType
      const response = await uploadProjections(selectedFile, playerType);
      setUploadStatus({ message: response.message || 'Upload successful!', type: 'success' });
      setSelectedFile(null); // Clear file input after successful upload
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'An unknown error occurred.';
      setUploadStatus({ message: errorMessage, type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-700 mb-4">{title}</h2>
      <form onSubmit={handleUpload}>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
          <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
          <label htmlFor={`${playerType}-file-upload`} className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-500 cursor-pointer">
            <span>{selectedFile ? 'Change file' : 'Upload a file'}</span>
            <input id={`${playerType}-file-upload`} name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".csv" />
          </label>
          <p className="mt-1 text-xs text-gray-500">CSV up to 10MB</p>
        </div>

        {selectedFile && (
          <div className="mt-4 flex items-center justify-center text-sm text-gray-700">
            <FileIcon className="h-5 w-5 text-gray-400 mr-2" />
            <span>{selectedFile.name}</span>
          </div>
        )}

        <div className="mt-6">
          <button
            type="submit"
            disabled={!selectedFile || isUploading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : `Upload ${title}`}
          </button>
        </div>
      </form>

      {uploadStatus.message && (
        <div className={`mt-4 p-3 rounded-lg flex items-start text-sm ${
          uploadStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {uploadStatus.type === 'success' ? <CheckCircle className="h-5 w-5 mr-2 shrink-0 mt-0.5" /> : <AlertCircle className="h-5 w-5 mr-2 shrink-0 mt-0.5" />}
          <span>{uploadStatus.message}</span>
        </div>
      )}
    </div>
  );
};

const Settings = () => {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Upload Projections</h1>
          <p className="text-gray-500 mb-8">
            Upload separate CSV files for hitter and pitcher projections from a source like FantasyPros.
            Each upload will overwrite the existing data for that player type.
          </p>
          <div className="space-y-10">
            <Uploader playerType="hitters" title="Hitter Projections" />
            <div className="border-t border-gray-200" />
            <Uploader playerType="pitchers" title="Pitcher Projections" />
          </div>
          <div className="border-t border-gray-200 my-8" />
          <ScoringSettingsEditor />
        </div>
      </div>
    </main>
  );
};

export default Settings;