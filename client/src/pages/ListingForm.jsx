import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';

const CATEGORIES = ['textbooks', 'electronics', 'furniture', 'clothing', 'other'];
const CONDITIONS = ['new', 'like-new', 'used', 'worn'];
const STATUSES = ['active', 'sold'];

const EMPTY_FORM = {
  title: '',
  price: 0,
  category: 'textbooks',
  condition: 'used',
  description: '',
  status: 'active',
};

export default function ListingForm() {
  const { id } = useParams(); // present only on /listings/:id
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  // TODO 3: when editing, load the existing listing and fill the form
  useEffect(() => {
    if (!isEditing) return;
    let cancelled = false;

    api
      .get(`/listings/${id}`)
      .then(({ data }) => {
        if (cancelled) return;
        // Server may wrap the listing, e.g. { listing: {...} }
        const l = data.listing || data;
        setForm({
          title: l.title ?? '',
          price: Number(l.price ?? 0),
          category: l.category ?? 'textbooks',
          condition: l.condition ?? 'used',
          description: l.description ?? '',
          status: l.status ?? 'active',
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.response?.data?.message || 'Could not load this listing.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // cleanup: ignore the response if the component unmounts / id changes
    return () => {
      cancelled = true;
    };
  }, [id, isEditing]);

  // TODO 1: one handler for every input, keyed by the input's name
  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      // price must be stored as a number; '' stays '' so the field can be cleared while typing
      [name]: name === 'price' ? (value === '' ? '' : Number(value)) : value,
    }));
  }

  // TODO 2 + 3: create or update
  async function onSubmit(e) {
    e.preventDefault(); // stop the browser's full-page form submit
    setError('');
    setSaving(true);

    // Build the payload explicitly. Never include `seller`: the server rejects it.
    const payload = {
      title: form.title,
      price: Number(form.price),
      category: form.category,
      condition: form.condition,
      description: form.description,
    };
    if (isEditing) payload.status = form.status;

    try {
      if (isEditing) {
        await api.patch(`/listings/${id}`, payload);
      } else {
        await api.post('/listings', payload);
      }
      navigate('/listings');
    } catch (err) {
      // show the server's message (400 negative price, 403 not your listing, ...)
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="p-6">Loading…</p>;

  const field = 'w-full rounded border border-gray-300 px-3 py-2';

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-4 text-2xl font-semibold">
        {isEditing ? 'Edit listing' : 'Sell an item'}
      </h1>

      {error && (
        <div role="alert" className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium">Title</label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="Calculus textbook"
            value={form.title}
            onChange={onChange}
            className={field}
          />
        </div>

        <div>
          <label htmlFor="price" className="mb-1 block text-sm font-medium">Price</label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="any"
            required
            value={form.price}
            onChange={onChange}
            className={field}
          />
        </div>

        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-medium">Category</label>
          <select id="category" name="category" value={form.category} onChange={onChange} className={field}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="condition" className="mb-1 block text-sm font-medium">Condition</label>
          <select id="condition" name="condition" value={form.condition} onChange={onChange} className={field}>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium">Description (optional)</label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={form.description}
            onChange={onChange}
            className={field}
          />
        </div>

        {isEditing && (
          <div>
            <label htmlFor="status" className="mb-1 block text-sm font-medium">Status</label>
            <select id="status" name="status" value={form.status} onChange={onChange} className={field}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Post listing'}
        </button>
      </form>
    </div>
  );
}
