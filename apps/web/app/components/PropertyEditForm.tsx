'use client';

import { useState } from 'react';

export interface NormalizedProperty {
  id: string;
  property_name: string | null;
  address: string | null;
  price: number | null;
  rent: number | null;
  yield: number | null;
  structure: string | null;
  built_year: string | null;
  station_info: string | null;
  editable_fields?: Record<string, unknown> | null;
  updated_at: string;
}

type Props = {
  property: NormalizedProperty;
};

type FormValues = {
  property_name: string;
  address: string;
  price: string;
  rent: string;
  yield: string;
  structure: string;
  built_year: string;
  station_info: string;
};

export function PropertyEditForm({ property }: Props) {
  const [values, setValues] = useState<FormValues>({
    property_name: property.property_name ?? '',
    address: property.address ?? '',
    price: property.price != null ? String(property.price) : '',
    rent: property.rent != null ? String(property.rent) : '',
    yield: property.yield != null ? String(property.yield) : '',
    structure: property.structure ?? '',
    built_year: property.built_year ?? '',
    station_info: property.station_info ?? '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormValues, string>>>({});

  function validate(): boolean {
    const errors: Partial<Record<keyof FormValues, string>> = {};

    if (values.price !== '' && isNaN(Number(values.price))) {
      errors.price = '価格は数値で入力してください';
    }
    if (values.rent !== '' && isNaN(Number(values.rent))) {
      errors.rent = '賃料は数値で入力してください';
    }
    if (values.yield !== '' && isNaN(Number(values.yield))) {
      errors.yield = '利回りは数値で入力してください';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const body = {
      property_name: values.property_name || null,
      address: values.address || null,
      price: values.price !== '' ? Number(values.price) : null,
      rent: values.rent !== '' ? Number(values.rent) : null,
      yield: values.yield !== '' ? Number(values.yield) : null,
      structure: values.structure || null,
      built_year: values.built_year || null,
      station_info: values.station_info || null,
    };

    try {
      const res = await fetch(`/api/properties/${property.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error ?? '保存に失敗しました');
      }

      setValues({
        property_name: data.property_name ?? '',
        address: data.address ?? '',
        price: data.price != null ? String(data.price) : '',
        rent: data.rent != null ? String(data.rent) : '',
        yield: data.yield != null ? String(data.yield) : '',
        structure: data.structure ?? '',
        built_year: data.built_year ?? '',
        station_info: data.station_info ?? '',
      });
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  }

  function handleChange(key: keyof FormValues, value: string) {
    setValues(prev => ({ ...prev, [key]: value }));
    setSaveSuccess(false);
    if (fieldErrors[key]) {
      setFieldErrors(prev => ({ ...prev, [key]: undefined }));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {saveError && (
        <div className="rounded-md bg-destructive text-white p-4 text-sm" role="alert">
          {saveError}
        </div>
      )}
      {saveSuccess && (
        <div className="rounded-md bg-green-100 text-green-800 p-4 text-sm" role="status">
          保存しました
        </div>
      )}

      <div className="space-y-4">
        <Field
          label="物件名"
          value={values.property_name}
          onChange={v => handleChange('property_name', v)}
          error={fieldErrors.property_name}
        />
        <Field
          label="住所"
          value={values.address}
          onChange={v => handleChange('address', v)}
          error={fieldErrors.address}
        />
        <Field
          label="価格（万円）"
          value={values.price}
          onChange={v => handleChange('price', v)}
          inputMode="decimal"
          error={fieldErrors.price}
        />
        <Field
          label="賃料（万円）"
          value={values.rent}
          onChange={v => handleChange('rent', v)}
          inputMode="decimal"
          error={fieldErrors.rent}
        />
        <Field
          label="利回り（%）"
          value={values.yield}
          onChange={v => handleChange('yield', v)}
          inputMode="decimal"
          error={fieldErrors.yield}
        />
        <Field
          label="構造"
          value={values.structure}
          onChange={v => handleChange('structure', v)}
          error={fieldErrors.structure}
        />
        <Field
          label="築年"
          value={values.built_year}
          onChange={v => handleChange('built_year', v)}
          error={fieldErrors.built_year}
        />
        <Field
          label="最寄り駅"
          value={values.station_info}
          onChange={v => handleChange('station_info', v)}
          error={fieldErrors.station_info}
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-md bg-primary text-primary-foreground py-2 px-4 text-sm font-medium disabled:opacity-50"
        >
          {isSaving ? '保存中...' : '保存する'}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  inputMode,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  error?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        inputMode={inputMode}
        className="w-full rounded-md border px-3 py-2 text-sm"
        aria-invalid={!!error}
      />
      {error && (
        <p className="text-xs text-destructive" role="alert">{error}</p>
      )}
    </div>
  );
}
