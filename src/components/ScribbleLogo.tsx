export function ScribbleLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      {/* Dense chaotic scribble-out ball — like pen scribbling aggressively */}
      <path
        d="M8 18 C12 8, 22 6, 30 12 C36 16, 32 26, 26 28 C20 30, 10 28, 8 22 C6 16, 14 10, 22 8 C30 6, 34 14, 32 22 C30 30, 20 32, 12 28 C4 24, 6 14, 14 10"
        stroke="#1a1a1a"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M12 14 C18 26, 28 10, 32 20 C34 26, 24 30, 16 26 C8 22, 12 12, 20 10 C28 8, 34 18, 28 26 C22 32, 10 26, 10 18"
        stroke="#1a1a1a"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M16 12 C10 22, 20 30, 28 22 C34 16, 26 8, 18 12 C10 16, 14 28, 24 28 C32 28, 32 16, 24 12"
        stroke="#1a1a1a"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M14 20 C20 10, 30 16, 28 24 C26 30, 16 28, 14 22 C12 16, 22 12, 28 18"
        stroke="#1a1a1a"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M18 16 C22 24, 30 20, 26 14 C22 8, 14 14, 18 22 C22 28, 30 24, 28 16"
        stroke="#1a1a1a"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
