// Hand-drawn style ingredient illustrations used as floating hero decorations.

export const Tomato = (props) => (
  <svg viewBox="0 0 64 64" {...props}>
    <circle cx="32" cy="32" r="30" fill="#FF4D3D" />
    <circle cx="32" cy="32" r="24" fill="#FF7A6B" />
    {[0, 60, 120, 180, 240, 300].map((a) => (
      <g key={a} transform={`rotate(${a} 32 32)`}>
        <path d="M32 32 L32 12 Q40 16 38 26 Z" fill="#FF4D3D" opacity=".55" />
        <ellipse cx="35" cy="20" rx="1.8" ry="3" fill="#FFE7CC" />
      </g>
    ))}
    <circle cx="32" cy="32" r="4" fill="#FF4D3D" />
  </svg>
)

export const Cheese = (props) => (
  <svg viewBox="0 0 64 64" {...props}>
    <path d="M4 46 L54 14 Q62 22 60 46 Z" fill="#FFC93C" />
    <path d="M4 46 H60 V54 H4 Z" fill="#F5B21B" />
    <circle cx="44" cy="34" r="4" fill="#F5B21B" />
    <circle cx="30" cy="40" r="2.6" fill="#F5B21B" />
    <circle cx="52" cy="25" r="2.2" fill="#F5B21B" />
    <circle cx="18" cy="50" r="2" fill="#E09A00" />
    <circle cx="46" cy="50" r="2.4" fill="#E09A00" />
  </svg>
)

export const Lettuce = (props) => (
  <svg viewBox="0 0 64 64" {...props}>
    <path d="M32 4 C44 8 58 18 58 34 C58 50 46 60 32 60 C18 60 6 50 6 34 C6 18 20 8 32 4 Z" fill="#2ECC71" />
    <path d="M32 6 C40 12 50 20 52 34 C50 46 42 54 32 56 C22 54 14 46 12 34 C14 20 24 12 32 6 Z" fill="#58D68D" />
    <path d="M32 8 V58 M32 22 L20 16 M32 22 L44 16 M32 34 L16 28 M32 34 L48 28 M32 46 L20 42 M32 46 L44 42" stroke="#27AE60" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
)

export const Bread = (props) => (
  <svg viewBox="0 0 64 64" {...props}>
    <path d="M12 58 V28 C4 26 4 8 20 8 H44 C60 8 60 26 52 28 V58 Z" fill="#D9883A" />
    <path d="M16 54 V26 C10 24 10 12 21 12 H43 C54 12 54 24 48 26 V54 Z" fill="#FFE7CC" />
    <circle cx="26" cy="30" r="1.4" fill="#E9C9A0" />
    <circle cx="38" cy="38" r="1.4" fill="#E9C9A0" />
    <circle cx="30" cy="46" r="1.4" fill="#E9C9A0" />
  </svg>
)

export const CoffeeBean = (props) => (
  <svg viewBox="0 0 64 64" {...props}>
    <ellipse cx="32" cy="32" rx="20" ry="28" fill="#6F3E1F" transform="rotate(25 32 32)" />
    <path d="M24 10 C40 22 24 42 40 54" stroke="#3E2010" strokeWidth="4" strokeLinecap="round" fill="none" />
  </svg>
)

export const Leaf = (props) => (
  <svg viewBox="0 0 64 64" {...props}>
    <path d="M8 56 C8 24 28 6 58 6 C58 36 40 56 8 56 Z" fill="#2ECC71" />
    <path d="M8 56 C24 40 38 26 52 12" stroke="#1E9E55" strokeWidth="2.5" strokeLinecap="round" fill="none" />
  </svg>
)

export const Onion = (props) => (
  <svg viewBox="0 0 64 64" {...props}>
    <circle cx="32" cy="32" r="28" fill="none" stroke="#C86DD7" strokeWidth="5" />
    <circle cx="32" cy="32" r="18" fill="none" stroke="#DDA0E6" strokeWidth="4" />
  </svg>
)
