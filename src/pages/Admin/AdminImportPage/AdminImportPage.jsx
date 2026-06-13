import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase'; // تأكد من مسار الاستيراد الصحيح

export default function AdminImportPage() {
  const [apiUrl, setApiUrl] = useState('');
  const [categoryMapping, setCategoryMapping] = useState('{"games":"games", "apps":"apps"}');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleImport = async () => {
    setLoading(true);
    setResult(null);
    try {
      const importFunc = httpsCallable(functions, 'importProductsFromExternal');
      const res = await importFunc({
        apiUrl,
        categoryMapping: JSON.parse(categoryMapping)
      });
      setResult({ success: true, count: res.data.count });
    } catch (err) {
      console.error(err);
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">استيراد المنتجات من متجر خارجي</h2>
      <div className="space-y-4">
        <div>
          <label className="block mb-1">رابط API (JSON)</label>
          <input
            type="text"
            className="border p-2 w-full rounded"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://api.example.com/products"
          />
        </div>
        <div>
          <label className="block mb-1">Mapping التصنيفات (JSON object)</label>
          <textarea
            className="border p-2 w-full rounded"
            rows="3"
            value={categoryMapping}
            onChange={(e) => setCategoryMapping(e.target.value)}
          />
          <p className="text-sm text-gray-500">مثال: {"{ \"games\": \"games\", \"apps\": \"apps\" }"}</p>
        </div>
        <button
          onClick={handleImport}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'جاري الاستيراد...' : 'استيراد المنتجات'}
        </button>
        {result && (
          <div className={`mt-4 p-3 rounded ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
            {result.success ? `✅ تم استيراد ${result.count} منتج بنجاح` : `❌ خطأ: ${result.error}`}
          </div>
        )}
      </div>
    </div>
  );
}