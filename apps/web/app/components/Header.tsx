import Link from "next/link";

export default function Header() {
  return (
    <header style={styles.header}>
      <Link href="/" style={styles.logo}>
        OCRWebApp
      </Link>
      <nav>
        <Link href="/upload" style={styles.navLink}>
          新規アップロード
        </Link>
      </nav>
    </header>
  );
}

const styles = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.75rem 2rem",
    borderBottom: "1px solid #e0e0e0",
    backgroundColor: "#fff",
  },
  logo: {
    fontWeight: "bold",
    fontSize: "1.1rem",
    textDecoration: "none",
    color: "#111",
  },
  navLink: {
    fontSize: "0.95rem",
    textDecoration: "none",
    color: "#0070f3",
  },
} as const;
