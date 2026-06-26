const base =
  'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50'
const normal = 'border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
const invalid = 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'

export default function Input({ label, id, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`${base} ${error ? invalid : normal} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
