import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useHotelData } from '../../context/HotelDataContext';
import { DEFAULT_OFFERS } from '../../data';
import { 
  Tag, 
  Plus, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Check, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Crown,
  AlertCircle
} from 'lucide-react';

export interface OfferRow {
  id: string;
  title: string;
  badge?: string | null;
  description?: string | null;
  perks: string[];
  price_note?: string | null;
  is_active: boolean;
  members_only?: boolean;
  sort_order?: number;
}

export const AdminOffersSection: React.FC = () => {
  const { refreshOffers } = useHotelData();
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOffer, setEditingOffer] = useState<OfferRow | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [perksText, setPerksText] = useState('');
  const [saving, setSaving] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const fetchOffersData = async () => {
    setLoading(true);
    try {
      // First get offers
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Also get member_only_offers from site_settings as fallback storage
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'member_only_offers')
        .maybeSingle();

      let memberOnlySet = new Set<string>();
      if (settingsData?.value) {
        try {
          const parsed = JSON.parse(settingsData.value);
          if (Array.isArray(parsed)) {
            memberOnlySet = new Set(parsed);
          }
        } catch {
          // ignore parse error
        }
      }

      const rows: OfferRow[] = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        badge: item.badge || 'Special',
        description: item.description || '',
        perks: Array.isArray(item.perks) ? item.perks : [],
        price_note: item.price_note || '',
        is_active: item.is_active ?? true,
        members_only: item.members_only ?? memberOnlySet.has(item.id),
        sort_order: item.sort_order || 0
      }));

      setOffers(rows);
    } catch (err: any) {
      console.error('Error fetching offers:', err);
      showToast(err?.message || 'Failed to load offers from Supabase', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffersData();
  }, []);

  const persistMemberOnlySettings = async (offerId: string, isMembersOnly: boolean) => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'member_only_offers')
        .maybeSingle();

      let currentList: string[] = [];
      if (data?.value) {
        try {
          currentList = JSON.parse(data.value);
        } catch {}
      }

      if (isMembersOnly) {
        if (!currentList.includes(offerId)) currentList.push(offerId);
      } else {
        currentList = currentList.filter(id => id !== offerId);
      }

      await supabase
        .from('site_settings')
        .upsert([{ key: 'member_only_offers', value: JSON.stringify(currentList), updated_at: new Date().toISOString() }]);
    } catch (err) {
      console.warn('Fallback setting sync error:', err);
    }
  };

  const handleToggleActive = async (offer: OfferRow) => {
    const newActive = !offer.is_active;
    try {
      const { error } = await supabase
        .from('offers')
        .update({ is_active: newActive })
        .eq('id', offer.id);

      if (error) throw error;

      setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, is_active: newActive } : o));
      showToast(`Offer "${offer.title}" ${newActive ? 'activated' : 'deactivated'}`);
      refreshOffers();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update active state', 'error');
    }
  };

  const handleToggleMembersOnly = async (offer: OfferRow) => {
    const newMembersOnly = !offer.members_only;
    try {
      // First attempt writing directly to column
      const { error } = await supabase
        .from('offers')
        .update({ members_only: newMembersOnly })
        .eq('id', offer.id);

      if (error) {
        // If column does not exist, persist in site_settings
        if (error.code === '42703' || error.message.includes('members_only')) {
          await persistMemberOnlySettings(offer.id, newMembersOnly);
        } else {
          throw error;
        }
      } else {
        // Also keep site_settings fallback in sync
        await persistMemberOnlySettings(offer.id, newMembersOnly);
      }

      setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, members_only: newMembersOnly } : o));
      showToast(`Offer "${offer.title}" is now ${newMembersOnly ? 'Member Exclusive' : 'Open to All Guests'}`);
      refreshOffers();
    } catch (err: any) {
      console.error('Error toggling members_only:', err);
      showToast(err?.message || 'Failed to update members-only setting', 'error');
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this offer?')) return;
    try {
      const { error } = await supabase.from('offers').delete().eq('id', id);
      if (error) throw error;
      setOffers(prev => prev.filter(o => o.id !== id));
      showToast('Offer deleted');
      refreshOffers();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete offer', 'error');
    }
  };

  const handleOpenAdd = () => {
    setEditingOffer({
      id: '',
      title: '',
      badge: 'Popular',
      description: '',
      perks: [],
      price_note: 'Inquire for Package Rate',
      is_active: true,
      members_only: false,
      sort_order: (offers.length || 0) + 1
    });
    setPerksText('');
    setShowModal(true);
  };

  const handleOpenEdit = (offer: OfferRow) => {
    setEditingOffer(offer);
    setPerksText(offer.perks.join('\n'));
    setShowModal(true);
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffer || !editingOffer.title.trim()) {
      showToast('Please provide an offer title', 'error');
      return;
    }

    setSaving(true);
    const parsedPerks = perksText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const isCreating = !editingOffer.id;

    try {
      const basePayload: any = {
        title: editingOffer.title.trim(),
        badge: editingOffer.badge?.trim() || null,
        description: editingOffer.description?.trim() || null,
        perks: parsedPerks,
        price_note: editingOffer.price_note?.trim() || null,
        is_active: editingOffer.is_active,
        sort_order: Number(editingOffer.sort_order) || 0
      };

      let savedId = editingOffer.id;

      // Try with members_only first
      let attemptPayload = { ...basePayload, members_only: editingOffer.members_only || false };

      if (isCreating) {
        const { data, error } = await supabase.from('offers').insert([attemptPayload]).select().single();
        if (error) {
          if (error.code === '42703' || error.message.includes('members_only')) {
            // retry without members_only
            const { data: retryData, error: retryError } = await supabase.from('offers').insert([basePayload]).select().single();
            if (retryError) throw retryError;
            savedId = retryData.id;
          } else {
            throw error;
          }
        } else {
          savedId = data.id;
        }
      } else {
        const { error } = await supabase.from('offers').update(attemptPayload).eq('id', editingOffer.id);
        if (error) {
          if (error.code === '42703' || error.message.includes('members_only')) {
            const { error: retryError } = await supabase.from('offers').update(basePayload).eq('id', editingOffer.id);
            if (retryError) throw retryError;
          } else {
            throw error;
          }
        }
      }

      // Sync member_only_offers fallback
      if (savedId) {
        await persistMemberOnlySettings(savedId, Boolean(editingOffer.members_only));
      }

      showToast(`Offer "${editingOffer.title}" saved successfully!`);
      setShowModal(false);
      fetchOffersData();
      refreshOffers();
    } catch (err: any) {
      console.error('Error saving offer:', err);
      showToast(err?.message || 'Failed to save offer', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSeedDefaults = async () => {
    setLoading(true);
    try {
      for (let i = 0; i < DEFAULT_OFFERS.length; i++) {
        const o = DEFAULT_OFFERS[i];
        await supabase.from('offers').insert([
          {
            title: o.title,
            badge: o.badge,
            description: o.description,
            perks: o.perks,
            price_note: o.priceNote,
            is_active: true,
            sort_order: i + 1
          }
        ]);
      }
      showToast('Seeded default hotel offers into Supabase');
      fetchOffersData();
      refreshOffers();
    } catch (err: any) {
      showToast(err?.message || 'Failed to seed offers', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {feedbackToast && (
        <div className={`p-4 rounded-lg text-sm font-medium flex items-center justify-between shadow-md border ${
          feedbackToast.type === 'error' 
            ? 'bg-rose-50 text-rose-800 border-rose-200' 
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          <span>{feedbackToast.message}</span>
          <button onClick={() => setFeedbackToast(null)} className="text-xs underline ml-4">Dismiss</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#DCD3C1]/80 shadow-xs">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#1D5D4C] flex items-center gap-2">
            <Tag className="w-6 h-6 text-[#1D5D4C]" />
            Hotel Offers &amp; Packages
          </h2>
          <p className="text-sm text-[#6E6559] mt-0.5">
            Manage packages, rates, inclusions, and member-exclusive discount gates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchOffersData}
            disabled={loading}
            className="px-3.5 py-2 text-sm font-medium text-[#2A2620] bg-[#F4EFE6] hover:bg-[#EAE2D2] rounded-lg border border-[#DCD3C1] transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#1D5D4C]' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 text-sm font-medium text-white bg-[#1D5D4C] hover:bg-[#154639] rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Offer</span>
          </button>
        </div>
      </div>

      {/* Offers Grid */}
      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-[#DCD3C1] text-center text-[#6E6559]">
          <RefreshCw className="w-8 h-8 animate-spin text-[#1D5D4C] mx-auto mb-2" />
          <p className="text-sm">Loading offers from Supabase database...</p>
        </div>
      ) : offers.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-[#DCD3C1] text-center text-[#6E6559] space-y-3">
          <Tag className="w-10 h-10 text-[#DCD3C1] mx-auto" />
          <p className="font-serif font-bold text-[#2A2620]">No offers found in Supabase</p>
          <p className="text-xs text-[#6E6559] max-w-sm mx-auto">
            The offers table in your database is currently empty. You can seed the 3 standard Royal Mgwasi packages or create your own.
          </p>
          <button
            onClick={handleSeedDefaults}
            className="px-4 py-2 bg-[#1D5D4C] text-white text-xs font-semibold rounded-lg hover:bg-[#154639]"
          >
            Import 3 Default Hotel Packages
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                offer.is_active 
                  ? 'bg-white border-[#DCD3C1]/80 shadow-xs' 
                  : 'bg-slate-50 border-slate-300 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-[#1D5D4C] text-[#F4EFE6] rounded-full">
                    {offer.badge || 'Package'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Active toggle */}
                    <button
                      onClick={() => handleToggleActive(offer)}
                      className={`text-xs px-2.5 py-1 rounded font-semibold transition-colors ${
                        offer.is_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                      title="Toggle active on public site"
                    >
                      {offer.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>

                <h3 className="font-serif font-bold text-lg text-[#2A2620]">
                  {offer.title}
                </h3>
                <p className="text-xs text-[#6E6559] mt-2 leading-relaxed">
                  {offer.description}
                </p>

                {/* Inclusions */}
                <div className="mt-4 pt-3 border-t border-[#EFE8D9]">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#1D5D4C] mb-2">
                    Inclusions ({offer.perks.length}):
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#2A2620]">
                    {offer.perks.map((perk, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#1D5D4C] shrink-0" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-[#EFE8D9]">
                <div className="text-xs font-semibold text-[#6E6559] mb-3">
                  Price: <span className="text-[#2A2620] font-bold">{offer.price_note || 'On Request'}</span>
                </div>

                {/* Members Only toggle */}
                <div className="p-2.5 rounded-lg bg-[#FBF9F5] border border-[#DCD3C1] mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8C6D3B]">
                    <Crown className="w-4 h-4" />
                    <span>Members Only Gate</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleMembersOnly(offer)}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                      offer.members_only ? 'bg-[#8C6D3B]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        offer.members_only ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(offer)}
                    className="px-3 py-1.5 text-xs font-semibold bg-[#F4EFE6] text-[#2A2620] hover:bg-[#EAE2D2] rounded border border-[#DCD3C1] flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteOffer(offer.id)}
                    className="p-1.5 text-[#6E6559] hover:text-rose-700 hover:bg-rose-50 rounded"
                    title="Delete offer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create Modal */}
      {showModal && editingOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#DCD3C1] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EFE8D9] pb-3 mb-4">
              <h3 className="text-xl font-serif font-bold text-[#1D5D4C]">
                {editingOffer.id ? 'Edit Hotel Offer' : 'Create New Offer'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#6E6559] hover:text-[#2A2620] text-lg font-bold p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveOffer} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                  Offer Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekend Live Music & Stay Package"
                  value={editingOffer.title}
                  onChange={(e) => setEditingOffer({ ...editingOffer, title: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                    Badge Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Popular, Business, Best Value"
                    value={editingOffer.badge || ''}
                    onChange={(e) => setEditingOffer({ ...editingOffer, badge: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                    Price Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Inquire for Weekend Rate"
                    value={editingOffer.price_note || ''}
                    onChange={(e) => setEditingOffer({ ...editingOffer, price_note: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Package description for guests..."
                  value={editingOffer.description || ''}
                  onChange={(e) => setEditingOffer({ ...editingOffer, description: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                  Perks &amp; Inclusions (One perk per line)
                </label>
                <textarea
                  rows={4}
                  placeholder="2 Nights Deluxe Room&#10;Complimentary Daily Breakfast&#10;Reserved Live Band VIP Seating&#10;Late Check-out at 2:00 PM"
                  value={perksText}
                  onChange={(e) => setPerksText(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C] font-mono text-xs"
                />
                <span className="text-[11px] text-[#6E6559] mt-0.5 block">
                  Each line becomes a bullet point with a checkmark on the public Offers page.
                </span>
              </div>

              <div className="p-3 bg-[#FBF9F5] rounded-lg border border-[#DCD3C1] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#2A2620]">Members Only Exclusive</div>
                    <div className="text-[11px] text-[#6E6559]">Only visible to signed-in loyalty club members</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={editingOffer.members_only || false}
                    onChange={(e) => setEditingOffer({ ...editingOffer, members_only: e.target.checked })}
                    className="w-4 h-4 rounded text-[#1D5D4C] focus:ring-[#1D5D4C]"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#EFE8D9]">
                  <div>
                    <div className="text-xs font-bold text-[#2A2620]">Active Status</div>
                    <div className="text-[11px] text-[#6E6559]">Visible on website</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={editingOffer.is_active}
                    onChange={(e) => setEditingOffer({ ...editingOffer, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-[#1D5D4C] focus:ring-[#1D5D4C]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EFE8D9]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-[#DCD3C1] rounded-lg text-[#6E6559] hover:bg-[#F4EFE6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#1D5D4C] text-white rounded-lg font-medium hover:bg-[#154639] disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
