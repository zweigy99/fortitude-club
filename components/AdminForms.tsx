type Partner = { id: string; name: string };

export function OfferFields({ partners, offer }: { partners: Partner[]; offer?: any }) {
  const o = offer ?? {};
  return (
    <>
      <div className="split" style={{ gap: 16 }}>
        <div className="field">
          <label htmlFor="partner_id">Partner</label>
          <select id="partner_id" name="partner_id" defaultValue={o.partner_id ?? ''} required>
            <option value="" disabled>Choose a partner</option>
            {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="title">Offer title</label>
          <input id="title" name="title" type="text" defaultValue={o.title ?? ''} placeholder="e.g. 20% off your first class pack" required />
        </div>
      </div>
      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" defaultValue={o.description ?? ''} />
      </div>
      <div className="field">
        <label htmlFor="terms">Terms</label>
        <textarea id="terms" name="terms" defaultValue={o.terms ?? ''} placeholder="Limits, expiry, first-time clients only, etc." />
      </div>
      <div className="split" style={{ gap: 16 }}>
        <div className="field">
          <label htmlFor="redeem_type">How members redeem</label>
          <select id="redeem_type" name="redeem_type" defaultValue={o.redeem_type ?? 'show_card'}>
            <option value="show_card">Show membership card at the front desk</option>
            <option value="code">Reveal a promo code</option>
            <option value="link">Go to the partner's booking link</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="promo_code">Promo code</label>
          <input id="promo_code" name="promo_code" type="text" defaultValue={o.promo_code ?? ''} />
          <span className="hint">Required for promo code offers.</span>
        </div>
        <div className="field">
          <label htmlFor="redeem_url">Booking link</label>
          <input id="redeem_url" name="redeem_url" type="url" defaultValue={o.redeem_url ?? ''} placeholder="https://" />
          <span className="hint">Required for booking link offers; optional otherwise.</span>
        </div>
      </div>
      <div className="row" style={{ gap: 24 }}>
        <div className="field" style={{ width: 160 }}>
          <label htmlFor="sort_order">Display order</label>
          <input id="sort_order" name="sort_order" type="number" defaultValue={o.sort_order ?? 0} />
        </div>
        <label className="check"><input name="active" type="checkbox" defaultChecked={o.active ?? false} /> Live on the site</label>
      </div>
    </>
  );
}

export function PartnerFields({ partner }: { partner?: any }) {
  const p = partner ?? {};
  return (
    <>
      <div className="split" style={{ gap: 16 }}>
        <div className="field"><label htmlFor="p_name">Name</label><input id="p_name" name="name" type="text" defaultValue={p.name ?? ''} required /></div>
        <div className="field">
          <label htmlFor="p_category">Category</label>
          <input id="p_category" name="category" type="text" list="categories" defaultValue={p.category ?? 'Fitness'} />
          <datalist id="categories">
            {['Fitness', 'Recovery', 'Health', 'Boxing', 'Spin', 'Yoga', 'Strength', 'Nutrition', 'Mental wellness', 'Massage'].map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div className="field"><label htmlFor="p_neigh">Neighbourhood</label><input id="p_neigh" name="neighbourhood" type="text" defaultValue={p.neighbourhood ?? ''} /></div>
      </div>
      <div className="split" style={{ gap: 16 }}>
        <div className="field"><label htmlFor="p_address">Address</label><input id="p_address" name="address" type="text" defaultValue={p.address ?? ''} /></div>
        <div className="field"><label htmlFor="p_web">Website</label><input id="p_web" name="website" type="url" defaultValue={p.website ?? ''} placeholder="https://" /></div>
        <div className="field">
          <label htmlFor="p_img">Photo URL</label>
          <input id="p_img" name="image_url" type="url" defaultValue={p.image_url ?? ''} placeholder="https://" />
          <span className="hint">A landscape photo link, shown on offer tiles.</span>
        </div>
      </div>
      <div className="field"><label htmlFor="p_desc">Description</label><textarea id="p_desc" name="description" defaultValue={p.description ?? ''} /></div>
      <label className="check"><input name="active" type="checkbox" defaultChecked={p.active ?? true} /> Shown on the site</label>
    </>
  );
}
