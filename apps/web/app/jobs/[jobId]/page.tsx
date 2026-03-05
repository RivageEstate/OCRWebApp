import { Suspense } from 'react';
import Loading from '../../components/Loading';
import { PollingJobStatus } from '../../components/PollingJobStatus';

type Props = {
  params: Promise<{ jobId: string }>;
};

export default async function JobStatusPage({ params }: Props) {
  const { jobId } = await params;

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-semibold mb-8">処理状況</h1>
        <Suspense fallback={<Loading />}>
          <PollingJobStatus jobId={jobId} />
        </Suspense>
      </div>
    </main>
  );
}
