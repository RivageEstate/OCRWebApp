import { FileUploadForm } from "../components/FileUploadForm";
import { PageShell } from "../components/PageShell";

export default function UploadPage() {
  return (
    <PageShell>
      <h1 className="font-heading text-3xl font-semibold mb-8 tracking-wide">
        物件画像をアップロード
      </h1>
      <FileUploadForm />
    </PageShell>
  );
}
