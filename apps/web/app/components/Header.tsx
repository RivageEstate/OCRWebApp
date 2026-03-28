import Link from "next/link";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-8 py-3 border-b border-border bg-card">
      <Link href="/" className="font-heading font-semibold text-lg text-foreground no-underline tracking-wide">
        OCRWebApp
      </Link>
      <nav>
        <Link href="/upload" className="text-sm font-medium text-primary no-underline hover:text-primary/80 transition-colors">
          新規アップロード
        </Link>
      </nav>
    </header>
  );
}
