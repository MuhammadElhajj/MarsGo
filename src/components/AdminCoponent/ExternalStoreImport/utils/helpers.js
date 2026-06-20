// src/components/AdminCoponent/ExternalStoreImport/utils/helpers.js
export function generateSlug(text) {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

export function getQuantityType(qtyValues) {
  if (!qtyValues) return 'fixed';
  const { min = 1, max = 1 } = qtyValues;
  return (min !== max || min > 1) ? 'variable' : 'fixed';
}