export function ScribbleLogo({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      {/* Chaotic scribble-out — overlapping loops like aggressive crossing out */}
      <path
        d="M6 10 C10 4, 18 6, 26 8 C32 10, 28 18, 22 16 C16 14, 10 20, 8 14 C6 8, 14 4, 20 10 C26 16, 30 12, 28 20 C26 28, 18 22, 12 26 C6 30, 4 22, 10 18 C16 14, 24 22, 30 18"
        stroke="#1a1a1a"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M8 20 C14 12, 22 28, 28 14 C30 10, 20 8, 14 16 C8 24, 20 30, 26 22 C30 16, 24 10, 16 14"
        stroke="#1a1a1a"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M10 12 C16 24, 24 8, 28 20 C30 26, 22 28, 14 22 C8 18, 12 8, 22 12"
        stroke="#1a1a1a"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
