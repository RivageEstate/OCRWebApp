function Loading() {
  return (
    <div className="flex flex-col items-center justify-center space-y-2 h-full p-8">
      <svg
        className="animate-spin h-16 w-16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
        <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
      </svg>

      <p className="text-center text-muted-foreground py-8 text-base font-semibold">処理中…</p>
    </div>
  );
}

export default Loading;
