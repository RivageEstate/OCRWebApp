# シーケンス図

- Title: シーケンス図（アップロード / Worker処理 / ステータスポーリング）
- Status: Draft
- Created: 2026-03-06
- Last Updated: 2026-03-06
- Owner: keikur1hara
- Language: JA

## 1. アップロード & ジョブ作成フロー

ユーザーが画像/PDFをアップロードし、非同期ジョブが登録されるまでの流れ。

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant UI as Web UI (Next.js)
    participant API as POST /api/documents
    participant Auth as Auth (x-user-id)
    participant Storage as StorageAdapter
    participant DB as PostgreSQL (Prisma)

    User->>UI: ファイル選択 & アップロード
    UI->>API: POST /api/documents (multipart/form-data)
    API->>Auth: x-user-id ヘッダー検証
    Auth-->>API: userId

    API->>API: ファイルバリデーション<br/>(jpg/png/pdf, 20MB以下)
    API->>Storage: upload(file)
    Storage-->>API: filePath

    API->>DB: documents.create({ userId, filePath })
    DB-->>API: document

    API->>DB: jobs.create({ documentId, status: queued })
    DB-->>API: job

    API-->>UI: 201 { document_id, job_id, status: "queued" }
    UI-->>User: ジョブ受付完了 → ポーリング開始
```

## 2. Worker 非同期処理フロー

Cloud Run Worker がジョブを取得し、OCR → LLM抽出 → 正規化データ保存するまでの流れ。

```mermaid
sequenceDiagram
    participant Worker as Cloud Run Worker
    participant DB as PostgreSQL (Prisma)
    participant Storage as StorageAdapter
    participant OCR as OCRProvider<br/>(Google Vision API)
    participant LLM as Extractor<br/>(OpenAI Structured Outputs)

    loop ジョブポーリング
        Worker->>DB: jobs.findFirst({ status: queued })
        DB-->>Worker: job (or null)
    end

    Worker->>DB: jobs.update({ status: processing })

    Worker->>DB: documents.findUnique(documentId)
    DB-->>Worker: document (filePath)

    Worker->>Storage: getSignedUrl(filePath)
    Storage-->>Worker: signedUrl

    Worker->>OCR: extractText(signedUrl)
    OCR-->>Worker: OCRResult (rawText, boundingBoxes)

    Worker->>DB: extractions.create({ rawText, boundingBoxes, ocrProvider, extractorVersion })

    Worker->>LLM: extract(rawText)
    LLM-->>Worker: NormalizedFields

    Worker->>DB: normalized_properties.create({ ...NormalizedFields })

    alt 成功
        Worker->>DB: jobs.update({ status: succeeded })
    else 失敗（retry=3回超過）
        Worker->>DB: jobs.update({ status: failed, errorMessage })
    end
```

## 3. ジョブステータスポーリングフロー

UI がジョブ完了を検知し、結果を表示するまでの流れ。

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant UI as Web UI (Next.js)
    participant API as GET /api/jobs/{jobId}

    loop 3秒ごとにポーリング (status が queued|processing の間)
        UI->>API: GET /api/jobs/{jobId}
        API-->>UI: { job_id, status, error_message }

        alt status = succeeded
            UI-->>User: 解析完了 → 結果画面へ遷移
        else status = failed
            UI-->>User: エラー表示 (error_message)
        else status = queued | processing
            UI->>UI: 待機して再ポーリング
        end
    end
```

## 関連ドキュメント

- システムアーキテクチャ: `docs/design/20260225-system-architecture.md`
- Job状態遷移: `docs/design/20260306-job-state-machine.md`
- API仕様: `contracts/openapi/phase0.yaml`
