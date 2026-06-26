/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'

const LABELS = ['', 'Terrible', 'Poor', 'Okay', 'Good', 'Excellent']

function Star({ filled, half, size = 20 }) {
  if (half) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <linearGradient id="half">
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#d1d5db" />
          </linearGradient>
        </defs>
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill="url(#half)"
        />
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill={filled ? '#f59e0b' : '#d1d5db'}
      />
    </svg>
  )
}

export function DisplayStars({ rating, size = 16 }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          filled={rating >= n}
          half={rating >= n - 0.5 && rating < n}
        />
      ))}
    </span>
  )
}

export function InteractiveStars({ value, onChange, size = 24 }) {
  const [hovered, setHovered] = useState(0)
  const active = hovered || value

  return (
    <span className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          className="transition-transform hover:scale-110 focus:outline-none"
          aria-label={`${n} star${n !== 1 ? 's' : ''}`}
        >
          <Star key={n} size={size} filled={active >= n} />
        </button>
      ))}
      {active > 0 && (
        <span className="ml-2 text-sm font-medium text-amber-600">{LABELS[active]}</span>
      )}
    </span>
  )
}
