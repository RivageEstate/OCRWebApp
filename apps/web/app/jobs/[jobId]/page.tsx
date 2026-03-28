import { PollingJobStatus } from '../../components/PollingJobStatus';
import { PageShell } from '../../components/PageShell';

type Props = {
  params: Promise<{ jobId: string }>;
};

export default async function JobStatusPage({ params }: Props) {
  const { jobId } = await params;

  return (
    <PageShell>
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-semibold mb-8 tracking-wide">
        処理状況
      </h1>
      <PollingJobStatus jobId={jobId} />
    </PageShell>
  );
}
