import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";

export default async function Header() {
  const session = await auth();

  return (
    <header className="flex items-center justify-between px-8 py-3 border-b border-border bg-card">
      <Link href="/" className="font-heading font-semibold text-lg text-foreground no-underline tracking-wide">
        OCRWebApp
      </Link>
      <nav className="flex items-center gap-4">
        <Link href="/upload" className="text-sm font-medium text-primary no-underline hover:text-primary/80 transition-colors">
          新規アップロード
        </Link>
        {session?.userId ? (
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              ログアウト
            </button>
          </form>
        ) : (
          <form
            action={async () => {
              "use server";
              await signIn("google");
            }}
          >
            <button
              type="submit"
              className="text-sm font-medium text-primary no-underline hover:text-primary/80 transition-colors"
            >
              ログイン
            </button>
          </form>
        )}
      </nav>
    </header>
  );
}
