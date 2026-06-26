import { useRef, useState } from 'react'
import { uploadImage, cloudinaryConfigured } from '@/lib/cloudinary'
import Spinner from '@/components/ui/Spinner'

export default function ImageUploader({ value = [], onChange }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  async function handleFiles(files) {
    if (!files?.length) return
    setUploading(true)
    try {
      const results = await Promise.all(Array.from(files).map((f) => uploadImage(f)))
      onChange([...value, ...results.map((r, i) => ({ ...r, order: value.length + i }))])
    } catch (e) {
      window.alert(e.message)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function remove(publicId) {
    onChange(
      value
        .filter((img) => img.publicId !== publicId)
        .map((img, i) => ({ ...img, order: i })),
    )
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={!cloudinaryConfigured || uploading}
        className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-6 text-sm text-muted transition-colors hover:border-brand-400 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? (
          <>
            <Spinner size="sm" />
            <span>Uploading…</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span>{cloudinaryConfigured ? 'Click to upload images' : 'Cloudinary not configured — set env vars'}</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {value.map((img) => (
            <div key={img.publicId} className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100">
              <img src={img.url} alt="" className="h-full w-full object-cover" loading="lazy" />
              <button
                type="button"
                onClick={() => remove(img.publicId)}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-red-600">Remove</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
