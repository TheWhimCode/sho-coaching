"use client";

import { useRef, useState } from 'react';
import styles from './recipes.module.css';

export type AddOnProduct = { id: string; name: string; gramsPerCount: number | null };

export default function AddOnForm({ products, onCreated }: { products: AddOnProduct[]; onCreated: (id: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [productId, setProductId] = useState(products[0]?.id ?? '');
  const product = products.find(item => item.id === productId);
  return <>
    <button className={styles.groceryButton} onClick={() => { setError(''); dialog.current?.showModal(); }}>Create add-on</button>
    <dialog className={styles.addonDialog} ref={dialog}>
      <form onSubmit={async event => {
        event.preventDefault();
        if (saving) return;
        const form = event.currentTarget;
        const data = new FormData(form);
        setSaving(true); setError('');
        try {
          const response = await fetch('/api/admin/recipes/addons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
            title: data.get('title'), groceryItemId: productId, quantity: Number(data.get('quantity')), measure: data.get('measure'), method: data.get('method'),
          }) });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error ?? 'Could not create add-on.');
          form.reset(); dialog.current?.close(); onCreated(result.id);
        } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not create add-on.'); }
        finally { setSaving(false); }
      }}>
        <h2>Create add-on</h2><p>One ingredient, added once per meal—not per serving.</p>
        <label>Name<input name="title" required maxLength={100} placeholder="e.g. Extra spinach" /></label>
        <label>Ingredient<select value={productId} onChange={event => setProductId(event.target.value)} required>{products.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <div className={styles.addonAmount}><label>Amount<input name="quantity" type="number" min="0.001" max="100000" step="any" required /></label>
        <label>Measure<select name="measure" key={productId} defaultValue="grams"><option value="grams">Grams</option>{product?.gramsPerCount && <option value="count">Count (1 = {product.gramsPerCount} g)</option>}</select></label></div>
        <label>Preparation (optional)<textarea name="method" rows={3} maxLength={2000} /></label>
        {error && <p role="alert">{error}</p>}
        <footer><button type="button" onClick={() => dialog.current?.close()}>Cancel</button><button type="submit" disabled={saving || !products.length}>{saving ? 'Creating…' : 'Create add-on'}</button></footer>
      </form>
    </dialog>
  </>;
}
