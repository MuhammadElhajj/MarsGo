import { useState, useEffect } from 'react';

export default function DynamicFields({ fields, onChange, initialValues = {} }) {
  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    onChange?.(values);
  }, [values, onChange]);

  const handleChange = (name, value) => {
    const newValues = { ...values, [name]: value };
    setValues(newValues);
  };

  if (!fields || fields.length === 0) return null;

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.name} className="flex flex-col">
          <label className="font-medium mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          {field.type === 'text' && (
            <input
              type="text"
              className={`border p-2 rounded ${field.name === 'playerId' ? 'player-id-input' : ''}`}
              placeholder={field.placeholder || ''}
              required={field.required}
              value={values[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
            />
          )}
          {field.type === 'number' && (
            <input
              type="number"
              className={`border p-2 rounded ${field.name === 'playerId' ? 'player-id-input' : ''}`}
              min={field.min}
              max={field.max}
              step={field.step || 1}
              defaultValue={field.defaultValue}
              required={field.required}
              onChange={(e) => handleChange(field.name, parseInt(e.target.value) || 0)}
            />
          )}
          {field.type === 'select' && (
            <select
              className="border p-2 rounded"
              required={field.required}
              value={values[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
            >
              <option value="">اختر...</option>
              {field.options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
        </div>
      ))}
    </div>
  );
}