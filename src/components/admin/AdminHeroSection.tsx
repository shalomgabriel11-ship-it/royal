import React, { useState, useEffect, useRef } from 'react';
import { supabase, getHeroImageUrl } from '../../lib/supabase';
import { useHotelData } from '../../context/HotelDataContext';
import { DEFAULT_HERO_SLIDES } from '../../data';
import { HeroSlide } from '../../types';
import { 
  Film, 
  UploadCloud, 
  Trash2, 
  RefreshCw, 
  Check, 
  Plus, 
  X, 
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Edit2,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const AdminHeroSection: React.FC = () => {
  const { refreshHeroSlides } = useHotelData();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // New slide form state
  const [newDescription, setNewDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const fetchSlidesData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const formatted: HeroSlide[] = (data || []).map(row => ({
        id: row.id,
        storage_path: row.storage_path,
        description: row.description || '',
        sort_order: row.sort_order ?? 0,
        is_active: Boolean(row.is_active),
        image_url: getHeroImageUrl(row.storage_path) || row.storage_path,
        created_at: row.created_at
      }));

      setSlides(formatted);
    } catch (err: any) {
      console.error('Error fetching hero slides:', err);
      showToast(err?.message || 'Failed to fetch hero slides', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlidesData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setNewDescription('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowAddModal(false);
    setEditingSlide(null);
  };

  const handleAddSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast('Please select an image file to upload', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `hero/${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${cleanName}`;

      // Upload directly into the 'hero-images' storage bucket
      const { error: uploadErr } = await supabase.storage
        .from('hero-images')
        .upload(storagePath, selectedFile, { cacheControl: '3600', upsert: true });

      if (uploadErr) throw uploadErr;

      // Calculate next sort order
      const nextOrder = slides.length > 0 ? Math.max(...slides.map(s => s.sort_order || 0)) + 1 : 1;

      // Insert row into hero_slides
      const { error: dbErr } = await supabase
        .from('hero_slides')
        .insert({
          storage_path: storagePath,
          description: newDescription.trim() || null,
          sort_order: nextOrder,
          is_active: true
        });

      if (dbErr) throw dbErr;

      showToast('New hero slide uploaded and activated!');
      resetForm();
      await fetchSlidesData();
      await refreshHeroSlides();
    } catch (err: any) {
      console.error('Error adding slide:', err);
      showToast(err?.message || 'Failed to add hero slide', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (slide: HeroSlide) => {
    try {
      const nextActive = !slide.is_active;
      const { error } = await supabase
        .from('hero_slides')
        .update({ is_active: nextActive })
        .eq('id', slide.id);

      if (error) throw error;

      showToast(`Slide ${nextActive ? 'activated' : 'hidden from homepage'}`);
      await fetchSlidesData();
      await refreshHeroSlides();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update slide status', 'error');
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const currentSlide = slides[index];
    const targetSlide = slides[targetIndex];

    try {
      // Swap sort_order values
      const currentOrder = currentSlide.sort_order;
      const targetOrder = targetSlide.sort_order;
      const newCurrentOrder = targetOrder === currentOrder ? (direction === 'up' ? currentOrder - 1 : currentOrder + 1) : targetOrder;

      await Promise.all([
        supabase.from('hero_slides').update({ sort_order: newCurrentOrder }).eq('id', currentSlide.id),
        supabase.from('hero_slides').update({ sort_order: currentOrder }).eq('id', targetSlide.id)
      ]);

      showToast('Slide order updated');
      await fetchSlidesData();
      await refreshHeroSlides();
    } catch (err: any) {
      showToast(err?.message || 'Failed to reorder slide', 'error');
    }
  };

  const handleDeleteSlide = async (slide: HeroSlide) => {
    if (!window.confirm(`Are you sure you want to delete this hero slide?`)) return;

    try {
      // Delete database row
      const { error: dbErr } = await supabase
        .from('hero_slides')
        .delete()
        .eq('id', slide.id);

      if (dbErr) throw dbErr;

      // Delete storage file if stored in hero-images bucket
      if (slide.storage_path && !slide.storage_path.startsWith('http://') && !slide.storage_path.startsWith('https://')) {
        await supabase.storage.from('hero-images').remove([slide.storage_path]);
      }

      showToast('Hero slide deleted');
      await fetchSlidesData();
      await refreshHeroSlides();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete hero slide', 'error');
    }
  };

  const handleSaveDescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('hero_slides')
        .update({
          description: editingSlide.description?.trim() || null
        })
        .eq('id', editingSlide.id);

      if (error) throw error;

      showToast('Slide description saved');
      setEditingSlide(null);
      await fetchSlidesData();
      await refreshHeroSlides();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update description', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeedDefaults = async () => {
    if (!window.confirm('Import the 3 current default hero photos into your custom hero slides database?')) return;

    setLoading(true);
    try {
      const rowsToInsert = DEFAULT_HERO_SLIDES.map((s, idx) => ({
        storage_path: s.storage_path,
        description: s.description,
        sort_order: idx + 1,
        is_active: true
      }));

      const { error } = await supabase.from('hero_slides').insert(rowsToInsert);
      if (error) throw error;

      showToast('Imported default hero slides! You can now customize or add unlimited photos.');
      await fetchSlidesData();
      await refreshHeroSlides();
    } catch (err: any) {
      showToast(err?.message || 'Failed to import default slides', 'error');
    } finally {
      setLoading(false);
    }
  };

  const activeCount = slides.filter(s => s.is_active).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 border text-sm font-medium transition-all ${
          feedbackToast.type === 'success' 
            ? 'bg-[#1D5D4C] text-white border-[#16473a]' 
            : 'bg-red-800 text-white border-red-900'
        }`}>
          {feedbackToast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#DCD3C1] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-[#1D5D4C]" />
            <h2 className="text-xl font-bold text-[#2A2620]">Hero Slideshow Management</h2>
          </div>
          <p className="text-sm text-[#7D766A] mt-1">
            Manage the rotating homepage Ken Burns slideshow. Add unlimited photos with custom descriptions, toggle active slides, and reorder.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => fetchSlidesData()}
            disabled={loading}
            className="px-3 py-2 text-xs font-semibold bg-[#EFE8D9] text-[#2A2620] hover:bg-[#E8DED0] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="px-4 py-2 text-xs font-bold bg-[#1D5D4C] hover:bg-[#16473a] text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Slide
          </button>
        </div>
      </div>

      {/* Status banner */}
      <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#DCD3C1] flex flex-wrap items-center justify-between gap-3 text-xs text-[#2A2620]">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[#7D766A]">Total Slides: </span>
            <strong className="text-sm text-[#1D5D4C]">{slides.length}</strong>
          </div>
          <div>
            <span className="text-[#7D766A]">Active on Homepage: </span>
            <strong className="text-sm text-[#1D5D4C]">{activeCount}</strong>
          </div>
          <div>
            <span className="text-[#7D766A]">Cycle Timing: </span>
            <strong className="text-sm text-[#2A2620]">6s crossfade</strong>
          </div>
        </div>

        {slides.length === 0 && (
          <button
            onClick={handleSeedDefaults}
            className="px-3 py-1.5 bg-[#C59B27] hover:bg-[#b0881e] text-white font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Import 3 Default Photos to Custom Slides
          </button>
        )}
      </div>

      {/* Slides list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-64 rounded-xl bg-[#EFE8D9]/70 animate-pulse border border-[#DCD3C1]" />
          ))}
        </div>
      ) : slides.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-[#DCD3C1] p-10 text-center">
          <Film className="w-12 h-12 text-[#A29A8E] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#2A2620]">No Custom Slides Yet</h3>
          <p className="text-sm text-[#7D766A] max-w-md mx-auto mt-1 mb-5">
            The homepage is currently displaying the 3 default high-resolution hotel exterior photos. You can upload custom slides or import the default ones to start editing.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#1D5D4C] hover:bg-[#16473a] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Upload First Slide
            </button>
            <button
              onClick={handleSeedDefaults}
              className="px-4 py-2 bg-[#EFE8D9] hover:bg-[#E8DED0] text-[#2A2620] text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#C59B27]" />
              Import 3 Default Photos
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {slides.map((slide, index) => (
            <div 
              key={slide.id}
              className={`bg-white rounded-xl border overflow-hidden transition-all flex flex-col justify-between ${
                slide.is_active ? 'border-[#DCD3C1] shadow-xs' : 'border-dashed border-[#C5BCAB] opacity-75 bg-[#F9F7F4]'
              }`}
            >
              {/* Image Preview */}
              <div className="relative aspect-[16/10] bg-black/5 overflow-hidden group">
                <img 
                  src={slide.image_url || slide.storage_path} 
                  alt={slide.description || `Hero slide ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
                
                {/* Active / Hidden badge */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider backdrop-blur-md shadow-xs ${
                    slide.is_active 
                      ? 'bg-[#1D5D4C]/90 text-white border border-white/20' 
                      : 'bg-black/70 text-[#DCD3C1] border border-white/10'
                  }`}>
                    {slide.is_active ? 'Active' : 'Hidden'}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-black/60 backdrop-blur-md text-white rounded-full border border-white/10">
                    #{index + 1}
                  </span>
                </div>

                {/* Reorder Buttons Overlay */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                  <button
                    onClick={() => handleMoveOrder(index, 'up')}
                    disabled={index === 0}
                    aria-label="Move slide up"
                    title="Move earlier in slideshow"
                    className="w-7 h-7 rounded-full bg-black/60 hover:bg-[#1D5D4C] text-white flex items-center justify-center backdrop-blur-md transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMoveOrder(index, 'down')}
                    disabled={index === slides.length - 1}
                    aria-label="Move slide down"
                    title="Move later in slideshow"
                    className="w-7 h-7 rounded-full bg-black/60 hover:bg-[#1D5D4C] text-white flex items-center justify-center backdrop-blur-md transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Slide Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold text-[#7D766A] uppercase tracking-wide">
                      Slide Description
                    </span>
                    <button
                      onClick={() => setEditingSlide(slide)}
                      className="text-[#1D5D4C] hover:text-[#16473a] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>
                  </div>
                  <p className="text-xs text-[#2A2620] line-clamp-2 min-h-[32px] italic">
                    {slide.description ? `"${slide.description}"` : <span className="text-[#A29A8E] not-italic">No custom caption (uses default)</span>}
                  </p>
                </div>

                {/* Slide Card Actions */}
                <div className="mt-4 pt-3 border-t border-[#EFE8D9] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleActive(slide)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      slide.is_active
                        ? 'bg-[#EFE8D9] hover:bg-[#E8DED0] text-[#2A2620]'
                        : 'bg-[#1D5D4C] hover:bg-[#16473a] text-white'
                    }`}
                  >
                    {slide.is_active ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        Activate
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteSlide(slide)}
                    className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete slide"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Slide Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#DCD3C1]">
            <div className="flex items-center justify-between border-b border-[#DCD3C1] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-[#1D5D4C]" />
                <h3 className="text-lg font-bold text-[#2A2620]">Add New Hero Slide</h3>
              </div>
              <button 
                onClick={resetForm}
                className="text-[#7D766A] hover:text-[#2A2620] p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSlide} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2A2620] uppercase tracking-wider mb-2">
                  Select Photo File *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-[#2A2620] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#1D5D4C] file:text-white hover:file:bg-[#16473a] file:cursor-pointer border border-[#DCD3C1] rounded-lg p-2"
                />
                <p className="text-[11px] text-[#7D766A] mt-1">
                  Uploads directly to the public <code className="bg-[#EFE8D9] px-1 py-0.5 rounded">hero-images</code> bucket.
                </p>
              </div>

              {filePreview && (
                <div>
                  <span className="block text-xs font-bold text-[#7D766A] mb-1">Image Preview:</span>
                  <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden bg-black/5 border border-[#DCD3C1]">
                    <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#2A2620] uppercase tracking-wider mb-1">
                  Slide Description / Caption (Optional)
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g., Lush Garden Courtyard & Outdoor Dining"
                  className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg text-sm focus:outline-none focus:border-[#1D5D4C]"
                />
                <p className="text-[11px] text-[#7D766A] mt-1">
                  Displayed in the hero card corner on the homepage while this slide is active.
                </p>
              </div>

              <div className="pt-3 border-t border-[#DCD3C1] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-xs font-semibold text-[#7D766A] hover:text-[#2A2620] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || isSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-[#1D5D4C] hover:bg-[#16473a] text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Save & Activate Slide
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Description Modal */}
      {editingSlide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#DCD3C1]">
            <div className="flex items-center justify-between border-b border-[#DCD3C1] pb-3 mb-4">
              <h3 className="text-base font-bold text-[#2A2620]">Edit Slide Caption</h3>
              <button 
                onClick={() => setEditingSlide(null)}
                className="text-[#7D766A] hover:text-[#2A2620] p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDescription} className="space-y-4">
              <div className="aspect-[16/9] w-full rounded-lg overflow-hidden bg-black/5 border border-[#DCD3C1]">
                <img 
                  src={editingSlide.image_url || editingSlide.storage_path} 
                  alt="Slide preview" 
                  className="w-full h-full object-cover" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2A2620] uppercase tracking-wider mb-1">
                  Description / Caption
                </label>
                <input
                  type="text"
                  value={editingSlide.description || ''}
                  onChange={(e) => setEditingSlide({ ...editingSlide, description: e.target.value })}
                  placeholder="e.g. Royal Mgwasi Hotel Exterior & Gardens"
                  className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg text-sm focus:outline-none focus:border-[#1D5D4C]"
                />
              </div>

              <div className="pt-3 border-t border-[#DCD3C1] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSlide(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#7D766A] hover:text-[#2A2620] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-[#1D5D4C] hover:bg-[#16473a] text-white rounded-lg transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
