import Link from "next/link";
import { PageShell } from "./components/PageShell";
import { Button } from "./components/ui/button";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <PageShell>
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-semibold mb-4 tracking-wide">
        物件概要書 OCR 解析ツール
      </h1>
      <p className="text-muted-foreground mb-8 leading-relaxed">
        物件概要書の画像をアップロードすると、OCR で自動解析し、編集可能なデータに変換します。
      </p>
      <Button asChild>
        <Link href="/upload">
          アップロードを開始する
          <ArrowRight />
        </Link>
      </Button>
    </PageShell>
  );
}
