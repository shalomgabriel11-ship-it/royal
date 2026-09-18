import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase, getGalleryImageUrl } from '../../lib/supabase';
import { useHotelData } from '../../context/HotelDataContext';
import { DEFAULT_GALLERY_IMAGES } from '../../data';
import { 
  Image as ImageIcon, 
  UploadCloud, 
  Trash2, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Plus, 
  Filter, 
  Check, 
  Layers
} from 'lucide-react';

export interface GalleryItemRow {
  id: string;
  title: string;
  category: string;
  storage_path: string;
  color_fallback?: string | null;
  sort_order: number;
  is_published: boolean;
}

const CATEGORIES = ['All', 'Grounds', 'Rooms', 'Pool', 'Dining', 'Events'];

export const AdminGallerySection: React.FC = () => {
  const { refreshGallery } = useHotelData();
  const [items, setItems] = useState<GalleryItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form for new gallery upload
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Grounds');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const fetchGalleryData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gallery_items')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (err: any) {
      console.error('Error fetching gallery:', err);
      showToast(err?.message || 'Failed to fetch gallery items', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGalleryData();
  }, []);

  const handleTogglePublish = async (item: GalleryItemRow) => {
    const newStatus = !item.is_published;
    try {
      const { error } = await supabase
        .from('gallery_items')
        .update({ is_published: newStatus })
        .eq('id', item.id);

      if (error) throw error;

      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_published: newStatus } : i));
      showToast(newStatus ? 'Photo published to website gallery' : 'Photo hidden from website gallery');
      refreshGallery();
    } catch (err: any) {
      showToast(err?.message || 'Failed to toggle status', 'error');
    }
  };

  const handleDelete = async (item: GalleryItemRow) => {
    if (!window.confirm(`Permanently delete photo "${item.title}"?`)) return;
    try {
      // Delete DB row
      const { error } = await supabase.from('gallery_items').delete().eq('id', item.id);
      if (error) throw error;

      // Delete from storage if it's a uploaded file
      if (item.storage_path && !item.storage_path.startsWith('default/')) {
        await supabase.storage.from('gallery-images').remove([item.storage_path]);
      }

      setItems(prev => prev.filter(i => i.id !== item.id));
      showToast('Photo removed from gallery');
      refreshGallery();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete photo', 'error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    if (!newTitle) {
      // Clean title from file name
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setNewTitle(nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1));
    }
  };

  const handleUploadNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !newTitle.trim()) {
      showToast('Please select a photo file and provide a title', 'error');
      return;
    }

    setUploading(true);
    try {
      const cleanName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `gallery/${newCategory.toLowerCase()}/${Date.now()}_${cleanName}`;

      // 1. Upload to storage bucket 'gallery-images'
      const { error: uploadErr } = await supabase.storage
        .from('gallery-images')
        .upload(storagePath, selectedFile, { cacheControl: '3600', upsert: true });

      if (uploadErr) throw uploadErr;

      // 2. Insert into gallery_items
      const nextOrder = items.length + 1;
      const { data, error: dbErr } = await supabase
        .from('gallery_items')
        .insert({
          title: newTitle.trim(),
          category: newCategory,
          storage_path: storagePath,
          color_fallback: '#1D5D4C',
          sort_order: nextOrder,
          is_published: true
        })
        .select()
        .single();

      if (dbErr) throw dbErr;

      if (data) {
        setItems(prev => [...prev, data]);
      }

      showToast('New photo uploaded and published to gallery!');
      setShowAddModal(false);
      setSelectedFile(null);
      setFilePreview(null);
      setNewTitle('');
      refreshGallery();
    } catch (err: any) {
      console.error('Error uploading photo:', err);
      showToast(err?.message || 'Failed to upload photo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSeedDefaults = async () => {
    setLoading(true);
    try {
      for (let i = 0; i < DEFAULT_GALLERY_IMAGES.length; i++) {
        const item = DEFAULT_GALLERY_IMAGES[i];
        await supabase.from('gallery_items').insert({
          title: item.title,
          category: item.category,
          storage_path: item.storage_path || `default/gallery_${i + 1}.jpg`,
          color_fallback: item.colorClass || '#1D5D4C',
          sort_order: i + 1,
          is_published: true
        });
      }
      showToast('Seeded default hotel gallery photos into Supabase');
      fetchGalleryData();
      refreshGallery();
    } catch (err: any) {
      showToast(err?.message || 'Failed to seed gallery', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'All') return items;
    return items.filter(i => i.category.toLowerCase() === selectedCategory.toLowerCase());
  }, [items, selectedCategory]);

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
            <ImageIcon className="w-6 h-6 text-[#1D5D4C]" />
            Hotel Photo Gallery
          </h2>
          <p className="text-sm text-[#6E6559] mt-0.5">
            Upload high-resolution property imagery, organize categories, or hide seasonal visuals.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchGalleryData}
            disabled={loading}
            className="px-3.5 py-2 text-sm font-medium text-[#2A2620] bg-[#F4EFE6] hover:bg-[#EAE2D2] rounded-lg border border-[#DCD3C1] transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#1D5D4C]' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-[#1D5D4C] hover:bg-[#154639] rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Photo</span>
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap border ${
              selectedCategory === cat
                ? 'bg-[#1D5D4C] text-white border-[#1D5D4C]'
                : 'bg-white text-[#6E6559] border-[#DCD3C1] hover:bg-[#F4EFE6]'
            }`}
          >
            {cat} {cat === 'All' ? `(${items.length})` : ''}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-[#DCD3C1] text-center text-[#6E6559]">
          <RefreshCw className="w-8 h-8 animate-spin text-[#1D5D4C] mx-auto mb-2" />
          <p className="text-sm">Loading gallery photos from Supabase...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-[#DCD3C1] text-center text-[#6E6559] space-y-3">
          <ImageIcon className="w-10 h-10 text-[#DCD3C1] mx-auto" />
          <p className="font-serif font-bold text-[#2A2620]">No gallery items in database</p>
          <p className="text-xs text-[#6E6559] max-w-sm mx-auto">
            Your gallery table in Supabase is currently empty. You can seed the default property visual set or upload new photos.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleSeedDefaults}
              className="px-4 py-2 bg-[#1D5D4C] text-white text-xs font-semibold rounded-lg hover:bg-[#154639]"
            >
              Seed Default Property Photos
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const imageUrl = getGalleryImageUrl(item.storage_path);
            return (
              <div
                key={item.id}
                className={`rounded-xl border overflow-hidden flex flex-col justify-between group transition-all ${
                  item.is_published 
                    ? 'bg-white border-[#DCD3C1]/80 shadow-xs' 
                    : 'bg-slate-50 border-slate-300 opacity-60'
                }`}
              >
                <div className="relative aspect-4/3 overflow-hidden bg-gray-100">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        // Fallback color if image storage path not found
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center text-white text-xs font-semibold"
                      style={{ backgroundColor: item.color_fallback || '#1D5D4C' }}
                    >
                      {item.title}
                    </div>
                  )}

                  <div className="absolute top-2 left-2 bg-[#1D5D4C]/90 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs">
                    {item.category}
                  </div>

                  {!item.is_published && (
                    <div className="absolute top-2 right-2 bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      Hidden
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <h4 className="font-serif font-bold text-sm text-[#2A2620] truncate" title={item.title}>
                    {item.title}
                  </h4>

                  <div className="mt-2 pt-2 border-t border-[#EFE8D9] flex items-center justify-between gap-1">
                    <button
                      onClick={() => handleTogglePublish(item)}
                      className={`text-[11px] font-semibold px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                        item.is_published
                          ? 'bg-[#F4EFE6] text-[#6E6559] hover:bg-[#EAE2D2]'
                          : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      }`}
                    >
                      {item.is_published ? (
                        <>
                          <EyeOff className="w-3 h-3" /> Hide
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" /> Publish
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1 text-[#6E6559] hover:text-rose-700 hover:bg-rose-50 rounded"
                      title="Delete photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Photo Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#DCD3C1]">
            <div className="flex items-center justify-between border-b border-[#EFE8D9] pb-3 mb-4">
              <h3 className="text-xl font-serif font-bold text-[#1D5D4C]">
                Upload Gallery Photo
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#6E6559] hover:text-[#2A2620] text-lg font-bold p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUploadNew} className="space-y-4 text-sm">
              {/* File Drop / Picker */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                  Select Photo File *
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#1D5D4C]/40 rounded-xl p-4 text-center cursor-pointer hover:bg-[#FBF9F5] transition-colors"
                >
                  {filePreview ? (
                    <div className="relative aspect-video max-h-40 mx-auto overflow-hidden rounded-lg">
                      <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="py-4">
                      <UploadCloud className="w-8 h-8 text-[#1D5D4C] mx-auto mb-2" />
                      <p className="text-xs font-semibold text-[#2A2620]">Click to choose an image</p>
                      <p className="text-[11px] text-[#6E6559] mt-0.5">JPG, PNG, or WEBP</p>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                  Photo Caption / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Garden Pavilion &amp; Fountain"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                  Category *
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C]"
                >
                  <option value="Grounds">Grounds</option>
                  <option value="Rooms">Rooms</option>
                  <option value="Pool">Pool</option>
                  <option value="Dining">Dining</option>
                  <option value="Events">Events</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EFE8D9]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#DCD3C1] rounded-lg text-[#6E6559] hover:bg-[#F4EFE6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-5 py-2 bg-[#1D5D4C] text-white rounded-lg font-medium hover:bg-[#154639] disabled:opacity-50 flex items-center gap-2"
                >
                  {uploading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{uploading ? 'Uploading to Bucket...' : 'Upload & Publish'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
