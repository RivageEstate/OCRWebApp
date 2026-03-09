import Link from "next/link";

export default function Header() {
  return (
    <header className="flex items-center justify-between border-b bg-background px-4 py-3 sm:px-8">
      <Link href="/" className="text-lg font-bold text-foreground no-underline">
        OCRWebApp
      </Link>
      <nav>
        <Link href="/upload" className="text-sm text-primary no-underline hover:underline">
          新規アップロード
        </Link>
      </nav>
    </header>
  );
}
