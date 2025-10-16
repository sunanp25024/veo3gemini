import React, { useState, useCallback } from 'react';
import { generateVideo } from './services/geminiService';
import { GenerationConfig, AspectRatio, Resolution, ImageFile, VEOModel } from './types';
import { OptionSelector } from './components/OptionSelector';
import { ImagePreview } from './components/ImagePreview';
import { VideoPlayer } from './components/VideoPlayer';
import { LoadingIndicator } from './components/LoadingIndicator';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        // remove data:mime/type;base64, prefix
        resolve(result.split(',')[1]);
    }
    reader.onerror = (error) => reject(error);
  });


export default function App() {
  const [prompt, setPrompt] = useState<string>('');
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [config, setConfig] = useState<GenerationConfig>({
    aspectRatio: '16:9',
    resolution: '1080p',
    model: 'veo-3.1-generate-preview',
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConfigChange = useCallback((key: keyof GenerationConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file (JPEG, PNG, GIF, etc.).');
        return;
      }
      setError(null);
      const base64 = await fileToBase64(file);
      setImageFile({
        file,
        previewUrl: URL.createObjectURL(file),
        base64,
      });
    }
  };

  const handleRemoveImage = () => {
    if (imageFile) {
      URL.revokeObjectURL(imageFile.previewUrl);
    }
    setImageFile(null);
  };
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setGeneratedVideoUrl(null);

    try {
      const videoUrl = await generateVideo(prompt, imageFile, config, setLoadingMessage);
      setGeneratedVideoUrl(videoUrl);
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <main className="w-full max-w-6xl mx-auto">
        <header className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
                VEO 3 Video Generator
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-400">
                Create stunning videos from text and images with Google's latest generative AI model.
            </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls Column */}
          <div className="bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-700">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="prompt" className="block text-lg font-semibold text-gray-200 mb-2">
                  Prompt
                </label>
                <textarea
                  id="prompt"
                  rows={5}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., A majestic lion roaring on a rocky outcrop at sunset, cinematic lighting."
                  className="w-full bg-gray-900 border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-200 p-3 transition"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="image-upload" className="block text-lg font-semibold text-gray-200 mb-2">
                  Reference Image (Optional)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                        <div className="flex text-sm text-gray-500"><label htmlFor="image-upload" className="relative cursor-pointer bg-gray-900 rounded-md font-medium text-indigo-400 hover:text-indigo-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-indigo-500 px-1"><span>Upload a file</span><input id="image-upload" name="image-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" disabled={isLoading}></label><p className="pl-1">or drag and drop</p></div>
                        <p className="text-xs text-gray-600">PNG, JPG, GIF up to 10MB</p>
                    </div>
                </div>
                {imageFile && <ImagePreview previewUrl={imageFile.previewUrl} onRemove={handleRemoveImage} />}
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-700">
                 <OptionSelector 
                    label="Model" 
                    options={['Quality', 'Fast']} 
                    selectedValue={config.model === 'veo-3.1-generate-preview' ? 'Quality' : 'Fast'} 
                    onChange={(v) => handleConfigChange('model', v === 'Quality' ? 'veo-3.1-generate-preview' : 'veo-3.1-fast-generate-preview')} 
                 />
                <OptionSelector label="Aspect Ratio" options={['16:9', '9:16']} selectedValue={config.aspectRatio} onChange={(v) => handleConfigChange('aspectRatio', v)} />
                <OptionSelector label="Resolution" options={['720p', '1080p']} selectedValue={config.resolution} onChange={(v) => handleConfigChange('resolution', v)} />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-lg text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              >
                {isLoading ? 'Generating...' : 'Generate Video'}
              </button>
            </form>
          </div>

          {/* Result Column */}
          <div className="bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-700 flex items-center justify-center min-h-[400px] lg:min-h-full">
            {isLoading && <LoadingIndicator message={loadingMessage} />}
            {error && <div className="text-center text-red-400 bg-red-900/50 p-4 rounded-lg">
                <h3 className="font-bold text-lg">An Error Occurred</h3>
                <p>{error}</p>
            </div>}
            {generatedVideoUrl && <VideoPlayer videoUrl={generatedVideoUrl} />}
            {!isLoading && !error && !generatedVideoUrl && (
              <div className="text-center text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                <p className="mt-2 text-lg">Your generated video will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
