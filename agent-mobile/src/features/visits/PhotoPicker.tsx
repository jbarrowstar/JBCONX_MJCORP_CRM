import React, { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { MAX_PHOTOS, validatePhotos } from '../../device/photos';

/** Photo selection through the device camera/gallery (standard file input; works in browsers and the Android WebView). */
export const PhotoPicker: React.FC<{ files: File[]; onChange: (f: File[]) => void; existing?: number }> = ({ files, onChange, existing = 0 }) => {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    const made = files.map((f) => URL.createObjectURL(f));
    setUrls(made);
    return () => made.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const add = (picked: FileList | null) => {
    if (!picked?.length) return;
    const next = [...files, ...Array.from(picked)];
    const problem = validatePhotos(next, existing);
    setError(problem);
    if (!problem) onChange(next);
    if (input.current) input.current.value = '';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700">Photos ({files.length + existing}/{MAX_PHOTOS})</span>
        <button type="button" onClick={() => input.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#274C77] bg-blue-50 rounded-lg">
          <Camera className="w-3.5 h-3.5" /> Add photo
        </button>
      </div>
      <input ref={input} data-testid="photo-input" aria-label="Add photos" type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => add(e.target.files)} />
      {error && <p role="alert" className="text-[11px] text-rose-600">{error}</p>}
      {files.length > 0 && (
        <ul className="flex gap-2 flex-wrap" data-testid="photo-previews">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
              {urls[i] && <img src={urls[i]} alt={f.name} className="w-full h-full object-cover" />}
              <button type="button" aria-label={`Remove ${f.name}`} onClick={() => onChange(files.filter((_, j) => j !== i))} className="absolute top-0 right-0 bg-black/60 text-white rounded-bl-lg p-0.5"><X className="w-3 h-3" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
