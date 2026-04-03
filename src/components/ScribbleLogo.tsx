export function ScribbleLogo({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      {/* Scribbled-out text lines (the "rewriting") */}
      <line x1="4" y1="10" x2="28" y2="10" stroke="#cccccc" strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="16" x2="24" y2="16" stroke="#cccccc" strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="22" x2="20" y2="22" stroke="#cccccc" strokeWidth="2" strokeLinecap="round" />

      {/* The scribble / strikethrough — hand-drawn feel */}
      <path
        d="M2 8 C6 20, 10 6, 14 18 C18 6, 22 22, 26 10 C28 6, 30 14, 30 14"
        stroke="#c44536"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Pen nib / writing tip at the end */}
      <path
        d="M27 11 L30 14 L28 15 Z"
        fill="#c44536"
      />
    </svg>
  );
}
