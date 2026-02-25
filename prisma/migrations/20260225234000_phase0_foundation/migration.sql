CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE "JobStatus" AS ENUM ('queued', 'processing', 'succeeded', 'failed');

CREATE TABLE "users" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL,
  "name" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "documents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "file_path" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "documents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "documents_user_id_idx" ON "documents"("user_id");

CREATE TABLE "extractions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "document_id" UUID NOT NULL,
  "raw_text" TEXT NOT NULL,
  "ocr_provider" TEXT NOT NULL,
  "confidence" DECIMAL(5,4),
  "bounding_boxes" JSONB NOT NULL,
  "extractor_version" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "extractions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "extractions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "extractions_document_id_idx" ON "extractions"("document_id");

CREATE TABLE "normalized_properties" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "document_id" UUID NOT NULL,
  "property_name" TEXT,
  "address" TEXT,
  "price" DECIMAL(14,2),
  "rent" DECIMAL(14,2),
  "yield" DECIMAL(5,2),
  "structure" TEXT,
  "built_year" TEXT,
  "station_info" TEXT,
  "editable_fields" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "normalized_properties_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "normalized_properties_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "normalized_properties_document_id_idx" ON "normalized_properties"("document_id");

CREATE TABLE "revisions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "property_id" UUID NOT NULL,
  "changed_by" UUID NOT NULL,
  "before" JSONB NOT NULL,
  "after" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "revisions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "revisions_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "normalized_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "revisions_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "revisions_property_id_idx" ON "revisions"("property_id");
CREATE INDEX "revisions_changed_by_idx" ON "revisions"("changed_by");

CREATE TABLE "jobs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "document_id" UUID NOT NULL,
  "status" "JobStatus" NOT NULL DEFAULT 'queued',
  "error_message" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "jobs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "jobs_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "jobs_document_id_idx" ON "jobs"("document_id");
CREATE INDEX "jobs_status_idx" ON "jobs"("status");

CREATE OR REPLACE FUNCTION set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_documents_updated_at
BEFORE UPDATE ON "documents"
FOR EACH ROW
EXECUTE FUNCTION set_current_timestamp_updated_at();

CREATE TRIGGER set_normalized_properties_updated_at
BEFORE UPDATE ON "normalized_properties"
FOR EACH ROW
EXECUTE FUNCTION set_current_timestamp_updated_at();

CREATE TRIGGER set_jobs_updated_at
BEFORE UPDATE ON "jobs"
FOR EACH ROW
EXECUTE FUNCTION set_current_timestamp_updated_at();
