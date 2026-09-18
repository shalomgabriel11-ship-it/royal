import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useHotelData } from '../../context/HotelDataContext';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Phone, 
  Clock, 
  MapPin, 
  Plus, 
  Trash2, 
  Check, 
  HelpCircle,
  ShieldAlert
} from 'lucide-react';

export interface SettingRow {
  key: string;
  value: string;
  updated_at?: string;
}

export const AdminSettingsSection: React.FC = () => {
  const { refreshAll } = useHotelData();
  const [allSettings, setAllSettings] = useState<SettingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Core settings form state
  const [coreForm, setCoreForm] = useState({
    whatsapp_number: '255762555557',
    reception_hours: 'Open 24 hours',
    reply_promise_minutes: '15',
    address: 'Forest Mpya, Mzumbe University area, Mbeya 54113',
  });

  // Custom Key/Value entries
  const [customKey, setCustomKey] = useState('');
  const [customValue, setCustomValue] = useState('');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const fetchSettingsData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) throw error;

      const rows: SettingRow[] = data || [];
      setAllSettings(rows);

      // Pre-fill core form with found values
      const map = new Map(rows.map(r => [r.key, r.value]));
      setCoreForm({
        whatsapp_number: map.get('whatsapp_number') || '255762555557',
        reception_hours: map.get('reception_hours') || 'Open 24 hours',
        reply_promise_minutes: map.get('reply_promise_minutes') || '15',
        address: map.get('address') || 'Forest Mpya, Mzumbe University area, Mbeya 54113',
      });
    } catch (err: any) {
      console.error('Error fetching site_settings:', err);
      showToast(err?.message || 'Failed to fetch site settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const handleSaveCore = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const updates = [
        { key: 'whatsapp_number', value: coreForm.whatsapp_number.trim(), updated_at: now },
        { key: 'reception_hours', value: coreForm.reception_hours.trim(), updated_at: now },
        { key: 'reply_promise_minutes', value: coreForm.reply_promise_minutes.trim(), updated_at: now },
        { key: 'address', value: coreForm.address.trim(), updated_at: now },
      ];

      const { error } = await supabase.from('site_settings').upsert(updates);
      if (error) throw error;

      showToast('Hotel site configuration saved successfully to Supabase!');
      await fetchSettingsData();
      refreshAll();
    } catch (err: any) {
      console.error('Error saving settings:', err);
      showToast(err?.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustomSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customKey.trim()) return;

    try {
      const { error } = await supabase.from('site_settings').upsert([
        {
          key: customKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
          value: customValue.trim(),
          updated_at: new Date().toISOString()
        }
      ]);

      if (error) throw error;

      showToast(`Setting "${customKey}" saved`);
      setCustomKey('');
      setCustomValue('');
      await fetchSettingsData();
      refreshAll();
    } catch (err: any) {
      showToast(err?.message || 'Failed to add setting', 'error');
    }
  };

  const handleDeleteSetting = async (key: string) => {
    if (!window.confirm(`Delete configuration key "${key}"?`)) return;
    try {
      const { error } = await supabase.from('site_settings').delete().eq('key', key);
      if (error) throw error;

      showToast(`Setting "${key}" deleted`);
      await fetchSettingsData();
      refreshAll();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete setting', 'error');
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
            <Settings className="w-6 h-6 text-[#1D5D4C]" />
            Site Settings &amp; Hotel Configuration
          </h2>
          <p className="text-sm text-[#6E6559] mt-0.5">
            Update hotel telephone numbers, WhatsApp routing, concierge response promises, and operational hours.
          </p>
        </div>
        <button
          onClick={fetchSettingsData}
          disabled={loading}
          className="px-3.5 py-2 text-sm font-medium text-[#2A2620] bg-[#F4EFE6] hover:bg-[#EAE2D2] rounded-lg border border-[#DCD3C1] transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#1D5D4C]' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Core Hotel Settings Card */}
      <div className="bg-white p-6 rounded-xl border border-[#DCD3C1]/80 shadow-xs">
        <h3 className="text-lg font-serif font-bold text-[#2A2620] mb-1">
          Operational Contact &amp; Front Desk Details
        </h3>
        <p className="text-xs text-[#6E6559] mb-5">
          These values appear in the website header, footer, booking forms, and quick-contact modals.
        </p>

        <form onSubmit={handleSaveCore} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* WhatsApp Number */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#1D5D4C]" />
                <span>WhatsApp Booking Number *</span>
              </label>
              <input
                type="text"
                required
                placeholder="255762555557"
                value={coreForm.whatsapp_number}
                onChange={(e) => setCoreForm({ ...coreForm, whatsapp_number: e.target.value })}
                className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C] text-sm"
              />
              <span className="text-[11px] text-[#6E6559] mt-1 block">
                Use international format with country code and NO "+" sign (e.g. <code className="bg-[#F4EFE6] px-1 rounded">255762555557</code>).
              </span>
            </div>

            {/* Response Time Promise */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#1D5D4C]" />
                <span>Response Guarantee (Minutes)</span>
              </label>
              <input
                type="text"
                required
                placeholder="15"
                value={coreForm.reply_promise_minutes}
                onChange={(e) => setCoreForm({ ...coreForm, reply_promise_minutes: e.target.value })}
                className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C] text-sm"
              />
              <span className="text-[11px] text-[#6E6559] mt-1 block">
                Displayed as "15-Min Response Guarantee" on booking inquiries.
              </span>
            </div>

            {/* Reception Hours */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#1D5D4C]" />
                <span>Reception &amp; Concierge Hours</span>
              </label>
              <input
                type="text"
                required
                placeholder="Open 24 hours"
                value={coreForm.reception_hours}
                onChange={(e) => setCoreForm({ ...coreForm, reception_hours: e.target.value })}
                className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C] text-sm"
              />
              <span className="text-[11px] text-[#6E6559] mt-1 block">
                e.g. "Open 24 hours" or "6:00 AM - 11:00 PM".
              </span>
            </div>

            {/* Hotel Address */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#1D5D4C]" />
                <span>Physical Address &amp; Landmarks</span>
              </label>
              <input
                type="text"
                required
                placeholder="Forest Mpya, Mzumbe University area, Mbeya 54113"
                value={coreForm.address}
                onChange={(e) => setCoreForm({ ...coreForm, address: e.target.value })}
                className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C] text-sm"
              />
              <span className="text-[11px] text-[#6E6559] mt-1 block">
                Address displayed on the Contact page and footer.
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#EFE8D9]">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#1D5D4C] text-white rounded-lg text-sm font-semibold hover:bg-[#154639] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Hotel Configuration'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Database Raw Key/Value Table */}
      <div className="bg-white p-6 rounded-xl border border-[#DCD3C1]/80 shadow-xs">
        <h3 className="text-lg font-serif font-bold text-[#2A2620] mb-1">
          Raw Supabase site_settings Key-Value Store
        </h3>
        <p className="text-xs text-[#6E6559] mb-4">
          All active keys stored in the database. You can add custom configuration strings or inspect values.
        </p>

        {/* Existing Keys Table */}
        <div className="border border-[#DCD3C1] rounded-lg overflow-hidden mb-5">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#DCD3C1] bg-[#F8F5EE] font-semibold uppercase tracking-wider text-[#6E6559]">
                <th className="py-2.5 px-4">Key</th>
                <th className="py-2.5 px-4">Value</th>
                <th className="py-2.5 px-4">Last Updated</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE8D9]">
              {allSettings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-[#6E6559]">
                    No settings rows currently in table
                  </td>
                </tr>
              ) : (
                allSettings.map((row) => (
                  <tr key={row.key} className="hover:bg-[#FDFBF7]">
                    <td className="py-3 px-4 font-mono font-bold text-[#1D5D4C]">
                      {row.key}
                    </td>
                    <td className="py-3 px-4 max-w-md truncate text-[#2A2620]" title={row.value}>
                      {row.value}
                    </td>
                    <td className="py-3 px-4 text-[#6E6559]">
                      {row.updated_at ? new Date(row.updated_at).toLocaleString() : 'System default'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteSetting(row.key)}
                        className="p-1 text-[#6E6559] hover:text-rose-700 hover:bg-rose-50 rounded"
                        title="Delete key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add custom key */}
        <form onSubmit={handleAddCustomSetting} className="bg-[#FBF9F5] p-4 rounded-lg border border-[#DCD3C1]">
          <div className="text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-2 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>Add or Overwrite Key-Value Setting</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <input
              type="text"
              required
              placeholder="e.g. check_in_time"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              className="sm:col-span-2 px-3 py-2 border border-[#DCD3C1] rounded-lg text-xs bg-white focus:outline-none focus:border-[#1D5D4C]"
            />
            <input
              type="text"
              required
              placeholder="Value (e.g. 14:00)"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              className="sm:col-span-2 px-3 py-2 border border-[#DCD3C1] rounded-lg text-xs bg-white focus:outline-none focus:border-[#1D5D4C]"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#1D5D4C] text-white text-xs font-semibold rounded-lg hover:bg-[#154639] transition-colors self-center"
            >
              Set Key
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
