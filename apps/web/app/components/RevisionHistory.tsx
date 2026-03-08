type Revision = {
  revision_id: string;
  changed_at: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
};

type Props = {
  revisions: Revision[];
};

const FIELD_LABELS: Record<string, string> = {
  property_name: "物件名",
  address: "住所",
  price: "価格（万円）",
  rent: "賃料（万円）",
  yield: "利回り（%）",
  structure: "構造",
  built_year: "築年",
  station_info: "最寄り駅",
  editable_fields: "その他フィールド"
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "（未設定）";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function getChangedFields(before: Record<string, unknown>, after: Record<string, unknown>) {
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return Array.from(allKeys).filter(
    (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key])
  );
}

export function RevisionHistory({ revisions }: Props) {
  return (
    <div className="rounded-lg border bg-card p-6 mt-6">
      <h2 className="text-lg font-semibold mb-4">変更履歴</h2>
      {revisions.length === 0 ? (
        <p className="text-sm text-muted-foreground">変更履歴なし</p>
      ) : (
        <ol className="space-y-4">
          {revisions.map((rev) => {
            const changedFields = getChangedFields(rev.before, rev.after);
            return (
              <li key={rev.revision_id} className="border rounded-md p-4 text-sm">
                <p className="text-xs text-muted-foreground mb-2">
                  {new Date(rev.changed_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
                </p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="pb-1 w-1/4">フィールド</th>
                      <th className="pb-1 w-3/8">変更前</th>
                      <th className="pb-1 w-3/8">変更後</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changedFields.map((field) => (
                      <tr key={field} className="border-t">
                        <td className="py-1 pr-2 font-medium">{FIELD_LABELS[field] ?? field}</td>
                        <td className="py-1 pr-2 text-red-600 line-through">
                          {formatValue(rev.before[field])}
                        </td>
                        <td className="py-1 text-green-700">{formatValue(rev.after[field])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
