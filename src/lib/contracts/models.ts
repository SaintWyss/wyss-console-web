export interface CatalogueEntry {
  model_id: string;
  display_name: string | null;
  provider_id: string | null;
  /** Null: the authority did not report it, which is not "no". */
  is_default: boolean | null;
  default_effort: string | null;
  efforts: string[] | null;
  /** The identifier of the model the runtime marks as replacing this one. */
  replaced_by: string | null;
  /** The date the runtime gives for retirement, as it gave it. */
  retires_at: string | null;
}

function invalid(field: string): Error {
  return new Error(`model_catalogue: invalid_${field}`);
}
function record(
  value: unknown,
  keys: readonly string[],
  field: string,
): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw invalid(field);
  const names = Object.keys(value);
  if (names.length !== keys.length || !keys.every((k) => names.includes(k)))
    throw invalid(field);
  return value as Record<string, unknown>;
}
/**
 * A provider identifier or effort as the desktop vouches for it: printable ASCII with no
 * space. A sentence, a link with words around it or a date in prose is never one.
 */
const IDENTIFIER = /^[\x21-\x7e]+$/;
function word(value: unknown, most: number, field: string): string | null {
  if (value === null) return null;
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > most ||
    !IDENTIFIER.test(value)
  )
    throw invalid(field);
  return value;
}
/** A display name may hold spaces; it is still one printable line. */
function name(value: unknown, field: string): string | null {
  if (value === null) return null;
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > 128 ||
    // eslint-disable-next-line no-control-regex
    /[\u0000-\u001f\u007f-\u009f]/.test(value)
  )
    throw invalid(field);
  return value;
}

export function parseCatalogueEntry(value: unknown): CatalogueEntry {
  const v = record(
    value,
    [
      'model_id',
      'display_name',
      'provider_id',
      'is_default',
      'default_effort',
      'efforts',
      'replaced_by',
      'retires_at',
    ],
    'entry',
  );
  const model = word(v.model_id, 256, 'model_id');
  if (model === null) throw invalid('model_id');
  let efforts: string[] | null = null;
  if (v.efforts !== null) {
    if (!Array.isArray(v.efforts) || v.efforts.length > 16)
      throw invalid('efforts');
    efforts = v.efforts.map((e) => {
      const effort = word(e, 64, 'efforts');
      if (effort === null) throw invalid('efforts');
      return effort;
    });
    if (new Set(efforts).size !== efforts.length) throw invalid('efforts');
  }
  if (v.is_default !== null && typeof v.is_default !== 'boolean')
    throw invalid('is_default');
  return {
    model_id: model,
    display_name: name(v.display_name, 'display_name'),
    provider_id: word(v.provider_id, 64, 'provider_id'),
    is_default: v.is_default,
    default_effort: word(v.default_effort, 64, 'default_effort'),
    efforts,
    replaced_by: word(v.replaced_by, 256, 'replaced_by'),
    retires_at: word(v.retires_at, 64, 'retires_at'),
  };
}
