import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUserId, UnauthorizedError } from "@/lib/auth/session";
import { isValidUuid } from "@/lib/validation/uuid";

type Params = {
  params: {
    jobId: string;
  };
};

export async function GET(request: Request, { params }: Params) {
  try {
    const userId = requireUserId(request);
    const { jobId } = params;

    if (!isValidUuid(jobId)) {
      return NextResponse.json({ error: "invalid_job_id" }, { status: 400 });
    }

    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        document: {
          userId
        }
      },
      select: {
        id: true,
        status: true,
        errorMessage: true,
        updatedAt: true
      }
    });

    if (!job) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        jobId: job.id,
        status: job.status,
        errorMessage: job.errorMessage,
        updatedAt: job.updatedAt
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
