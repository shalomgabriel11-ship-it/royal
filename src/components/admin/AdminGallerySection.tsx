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
  Check, 
  Layers,
  Star,
  ArrowUp,
  ArrowDown,
  Edit2,
  X,
  AlertCircle,
  FileText
} from 'lucide-react';

export interface GalleryItemImageRow {
  id: string;
  gallery_item_id: string;
  storage_path: string;
  description?: string | null;
  sort_order: number;
  is_cover: boolean;
}

export interface GalleryItemRow {
  id: string;
  title: string;
  category: string;
  storage_path?: string | null;
  color_class?: string | null;
  sort_order: number;
  is_published: boolean;
  gallery_item_images?: GalleryItemImageRow[];
}

const CATEGORIES = ['All', 'Grounds', 'Rooms', 'Pool', 'Dining', 'Events'];

export const AdminGallerySection: React.FC = () => {
  const { refreshGallery } = useHotelData();
  const [items, setItems] = useState<GalleryItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [selectedItemForPhotos, setSelectedItemForPhotos] = useState<GalleryItemRow | null>(null);
  const [editingItem, setEditingItem] = useState<GalleryItemRow | null>(null);

  // Uploading state
  const [uploading, setUploading] = useState(false);
  const [uploadingAlbumPhotos, setUploadingAlbumPhotos] = useState(false);

  // Form for new gallery album
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Grounds');
  const [newPhotoDesc, setNewPhotoDesc] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  // Photo description editing map
  const [editingDescriptions, setEditingDescriptions] = useState<Record<string, string>>({});
  const [savingDescId, setSavingDescId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const fetchGalleryData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gallery_items')
        .select(`
          *,
          gallery_item_images (
            id,
            gallery_item_id,
            storage_path,
            description,
            sort_order,
            is_cover
          )
        `)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      // Deduplicate rows by id to ensure unique album cards even if query or policy returns duplicates
      const seenIds = new Set<string>();
      const formattedItems: GalleryItemRow[] = [];
      for (const item of (data || [])) {
        if (!item?.id || seenIds.has(item.id)) continue;
        seenIds.add(item.id);
        // Sort child photos by sort_order
        const images: GalleryItemImageRow[] = (item.gallery_item_images || [])
          .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
        formattedItems.push({
          ...item,
          gallery_item_images: images
        });
      }

      setItems(formattedItems);

      // Keep photo modal in sync if open
      if (selectedItemForPhotos) {
        const updated = formattedItems.find(i => i.id === selectedItemForPhotos.id);
        if (updated) setSelectedItemForPhotos(updated);
      }
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
      showToast(newStatus ? 'Album published to website gallery' : 'Album hidden from website gallery');
      refreshGallery();
    } catch (err: any) {
      showToast(err?.message || 'Failed to toggle status', 'error');
    }
  };

  const handleDeleteItem = async (item: GalleryItemRow) => {
    if (!window.confirm(`Permanently delete gallery item "${item.title}" and all its photos?`)) return;
    try {
      // 1. Delete DB rows from gallery_item_images
      await supabase.from('gallery_item_images').delete().eq('gallery_item_id', item.id);

      // 2. Delete DB row from gallery_items
      const { error } = await supabase.from('gallery_items').delete().eq('id', item.id);
      if (error) throw error;

      // 3. Delete files from storage
      const storagePaths: string[] = [];
      if (item.storage_path && !item.storage_path.startsWith('default/')) {
        storagePaths.push(item.storage_path);
      }
      (item.gallery_item_images || []).forEach(img => {
        if (img.storage_path && !img.storage_path.startsWith('default/')) {
          storagePaths.push(img.storage_path);
        }
      });
      if (storagePaths.length > 0) {
        await supabase.storage.from('gallery-images').remove(storagePaths);
      }

      setItems(prev => prev.filter(i => i.id !== item.id));
      showToast('Gallery album removed');
      refreshGallery();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete album', 'error');
    }
  };

  const handleMoveItemOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const currentItem = items[index];
    const targetItem = items[targetIndex];

    try {
      const currentOrder = currentItem.sort_order;
      const targetOrder = targetItem.sort_order;
      const newCurrentOrder = targetOrder === currentOrder ? (direction === 'up' ? currentOrder - 1 : currentOrder + 1) : targetOrder;

      await Promise.all([
        supabase.from('gallery_items').update({ sort_order: newCurrentOrder }).eq('id', currentItem.id),
        supabase.from('gallery_items').update({ sort_order: currentOrder }).eq('id', targetItem.id)
      ]);

      showToast('Gallery album order updated');
      fetchGalleryData();
      refreshGallery();
    } catch (err: any) {
      showToast(err?.message || 'Failed to reorder gallery album', 'error');
    }
  };

  const handleUploadNewAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Please provide an album title', 'error');
      return;
    }

    setUploading(true);
    try {
      let storagePath: string | null = null;
      let nextOrder = items.length + 1;

      // Upload initial cover image if selected
      if (selectedFile) {
        const cleanName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        storagePath = `gallery/${newCategory.toLowerCase()}/${Date.now()}_${cleanName}`;
        const { error: uploadErr } = await supabase.storage
          .from('gallery-images')
          .upload(storagePath, selectedFile, { cacheControl: '3600', upsert: true });

        if (uploadErr) throw uploadErr;
      }

      // Insert gallery_items row
      const { data: createdItem, error: dbErr } = await supabase
        .from('gallery_items')
        .insert({
          title: newTitle.trim(),
          category: newCategory,
          storage_path: storagePath,
          color_class: 'ph--forest',
          sort_order: nextOrder,
          is_published: true
        })
        .select()
        .single();

      if (dbErr) throw dbErr;

      // Also insert into gallery_item_images if image was uploaded
      if (createdItem && storagePath) {
        await supabase
          .from('gallery_item_images')
          .insert({
            gallery_item_id: createdItem.id,
            storage_path: storagePath,
            description: newPhotoDesc.trim() || newTitle.trim(),
            sort_order: 1,
            is_cover: true
          });
      }

      showToast('New gallery album created!');
      setShowAddModal(false);
      setSelectedFile(null);
      setFilePreview(null);
      setNewTitle('');
      setNewPhotoDesc('');
      await fetchGalleryData();
      refreshGallery();
    } catch (err: any) {
      console.error('Error creating gallery item:', err);
      showToast(err?.message || 'Failed to create gallery album', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveItemDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const { error } = await supabase
        .from('gallery_items')
        .update({
          title: editingItem.title.trim(),
          category: editingItem.category
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      showToast('Album details updated');
      setShowEditItemModal(false);
      setEditingItem(null);
      await fetchGalleryData();
      refreshGallery();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update album', 'error');
    }
  };

  // MULTI-PHOTO ALBUM MANAGEMENT (mirroring AdminRoomsSection photo pattern)

  const handleUploadPhotosToAlbum = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedItemForPhotos) return;

    setUploadingAlbumPhotos(true);
    const existingImages = selectedItemForPhotos.gallery_item_images || [];
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `gallery/${selectedItemForPhotos.id}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${cleanName}`;

      try {
        // Upload to gallery-images bucket
        const { error: uploadErr } = await supabase.storage
          .from('gallery-images')
          .upload(storagePath, file, { cacheControl: '3600', upsert: true });

        if (uploadErr) throw uploadErr;

        const nextOrder = existingImages.length + i + 1;
        const isCover = existingImages.length === 0 && i === 0;

        // Auto generate initial description from filename
        const cleanDesc = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        const initialDesc = cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1);

        // Insert row into gallery_item_images
        const { error: dbErr } = await supabase
          .from('gallery_item_images')
          .insert({
            gallery_item_id: selectedItemForPhotos.id,
            storage_path: storagePath,
            description: initialDesc,
            sort_order: nextOrder,
            is_cover: isCover
          });

        if (dbErr) throw dbErr;
        successCount++;
      } catch (err: any) {
        console.error('Error uploading gallery photo:', err);
        showToast(`Failed uploading ${file.name}: ${err?.message || 'Storage error'}`, 'error');
      }
    }

    if (successCount > 0) {
      showToast(`Uploaded ${successCount} photo(s) to this gallery album!`);
      await fetchGalleryData();
      refreshGallery();
    }
    setUploadingAlbumPhotos(false);
    if (multiFileInputRef.current) multiFileInputRef.current.value = '';
  };

  const handleSetCoverPhoto = async (photoId: string, albumId: string) => {
    try {
      // Set all other images for this album to is_cover: false
      await supabase
        .from('gallery_item_images')
        .update({ is_cover: false })
        .eq('gallery_item_id', albumId);

      // Set selected image as cover
      const { error } = await supabase
        .from('gallery_item_images')
        .update({ is_cover: true })
        .eq('id', photoId);

      if (error) throw error;

      showToast('Set photo as main cover');
      await fetchGalleryData();
      refreshGallery();
    } catch (err: any) {
      showToast(err?.message || 'Failed to set cover photo', 'error');
    }
  };

  const handleMovePhotoOrder = async (index: number, direction: 'up' | 'down') => {
    if (!selectedItemForPhotos) return;
    const images = selectedItemForPhotos.gallery_item_images || [];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const currentImg = images[index];
    const targetImg = images[targetIndex];

    try {
      const currentOrder = currentImg.sort_order;
      const targetOrder = targetImg.sort_order;
      const newCurrentOrder = targetOrder === currentOrder ? (direction === 'up' ? currentOrder - 1 : currentOrder + 1) : targetOrder;

      await Promise.all([
        supabase.from('gallery_item_images').update({ sort_order: newCurrentOrder }).eq('id', currentImg.id),
        supabase.from('gallery_item_images').update({ sort_order: currentOrder }).eq('id', targetImg.id)
      ]);

      showToast('Photo order updated');
      await fetchGalleryData();
      refreshGallery();
    } catch (err: any) {
      showToast(err?.message || 'Failed to reorder photo', 'error');
    }
  };

  const handleDeletePhoto = async (photo: GalleryItemImageRow) => {
    if (!window.confirm('Delete this photo from the album?')) return;

    try {
      const { error: dbErr } = await supabase
        .from('gallery_item_images')
        .delete()
        .eq('id', photo.id);

      if (dbErr) throw dbErr;

      if (photo.storage_path && !photo.storage_path.startsWith('default/')) {
        await supabase.storage.from('gallery-images').remove([photo.storage_path]);
      }

      // If photo was cover, promote another photo to cover if available
      if (photo.is_cover && selectedItemForPhotos) {
        const remaining = (selectedItemForPhotos.gallery_item_images || []).filter(img => img.id !== photo.id);
        if (remaining.length > 0) {
          await supabase
            .from('gallery_item_images')
            .update({ is_cover: true })
            .eq('id', remaining[0].id);
        }
      }

      showToast('Photo removed from album');
      await fetchGalleryData();
      refreshGallery();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete photo', 'error');
    }
  };

  const handleSavePhotoDescription = async (photoId: string) => {
    const desc = editingDescriptions[photoId];
    if (desc === undefined) return;

    setSavingDescId(photoId);
    try {
      const { error } = await supabase
        .from('gallery_item_images')
        .update({ description: desc.trim() || null })
        .eq('id', photoId);

      if (error) throw error;

      showToast('Photo description saved');
      await fetchGalleryData();
      refreshGallery();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update description', 'error');
    } finally {
      setSavingDescId(null);
    }
  };

  const handleSeedDefaults = async () => {
    if (loading || seeding) return;

    setSeeding(true);
    setLoading(true);
    try {
      // 1. Fetch current gallery items from Supabase to check for existing items by title
      const { data: existingRows, error: fetchErr } = await supabase
        .from('gallery_items')
        .select('id, title, sort_order');

      if (fetchErr) throw fetchErr;

      const currentItems = existingRows || [];
      const existingTitles = new Set(
        [...items, ...currentItems].map((r: any) => (r.title || '').trim().toLowerCase())
      );

      // Skip items whose title already exists
      const itemsToSeed = DEFAULT_GALLERY_IMAGES.filter(
        item => !existingTitles.has(item.title.trim().toLowerCase())
      );

      if (itemsToSeed.length === 0) {
        showToast('All default gallery items already exist in database');
        await fetchGalleryData();
        return;
      }

      // Calculate starting sort order to place new items after existing ones
      let maxSortOrder = Math.max(
        0,
        ...currentItems.map((r: any) => r.sort_order || 0),
        ...items.map(i => i.sort_order || 0)
      );

      let seededCount = 0;
      for (let i = 0; i < itemsToSeed.length; i++) {
        const item = itemsToSeed[i];
        maxSortOrder += 1;
        const storagePath = item.storage_path || `default/gallery_${i + 1}.jpg`;
        
        const { data: created, error: insertErr } = await supabase
          .from('gallery_items')
          .insert({
            title: item.title,
            category: item.category,
            storage_path: storagePath,
            color_class: item.colorClass || 'ph--forest',
            sort_order: maxSortOrder,
            is_published: true
          })
          .select()
          .single();

        if (insertErr) {
          console.error('Error inserting default gallery item:', insertErr);
          continue;
        }

        if (created) {
          seededCount++;
          // Also create initial gallery_item_images row
          await supabase.from('gallery_item_images').insert({
            gallery_item_id: created.id,
            storage_path: storagePath,
            description: item.title,
            sort_order: 1,
            is_cover: true
          });
        }
      }

      if (seededCount > 0) {
        showToast(`Seeded ${seededCount} default gallery item${seededCount > 1 ? 's' : ''} into Supabase`);
      } else {
        showToast('Default gallery items already exist');
      }

      await fetchGalleryData();
      refreshGallery();
    } catch (err: any) {
      console.error('Error seeding gallery:', err);
      showToast(err?.message || 'Failed to seed gallery', 'error');
    } finally {
      setSeeding(false);
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    const list = selectedCategory === 'All' 
      ? items 
      : items.filter(i => i.category.toLowerCase() === selectedCategory.toLowerCase());
    
    // Deduplicate by ID to guarantee every album card is rendered exactly once
    const seen = new Set<string>();
    return list.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [items, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Toast */}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#DCD3C1]/80 shadow-xs">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#1D5D4C] flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-[#1D5D4C]" />
            Hotel Photo Gallery &amp; Albums
          </h2>
          <p className="text-sm text-[#6E6559] mt-0.5">
            Manage multi-photo albums with individual descriptions. Guests see interactive carousels for multi-photo albums.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchGalleryData}
            disabled={loading}
            className="px-3.5 py-2 text-sm font-medium text-[#2A2620] bg-[#F4EFE6] hover:bg-[#EAE2D2] rounded-lg border border-[#DCD3C1] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#1D5D4C]' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => {
              setNewTitle('');
              setNewCategory('Grounds');
              setNewPhotoDesc('');
              setSelectedFile(null);
              setFilePreview(null);
              setShowAddModal(true);
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-[#1D5D4C] hover:bg-[#154639] rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Album</span>
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap border cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#1D5D4C] text-white border-[#1D5D4C]'
                : 'bg-white text-[#6E6559] border-[#DCD3C1] hover:bg-[#F4EFE6]'
            }`}
          >
            {cat} {cat === 'All' ? `(${items.length})` : ''}
          </button>
        ))}
      </div>

      {/* Gallery Albums Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="h-64 rounded-xl bg-[#EFE8D9]/70 animate-pulse border border-[#DCD3C1]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-[#DCD3C1] text-center text-[#6E6559] space-y-3">
          <ImageIcon className="w-10 h-10 text-[#DCD3C1] mx-auto" />
          <p className="font-serif font-bold text-[#2A2620]">No gallery albums in database</p>
          <p className="text-xs text-[#6E6559] max-w-sm mx-auto">
            Your gallery table in Supabase is currently empty. You can seed the default property visual set or create new albums.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleSeedDefaults}
              disabled={loading || seeding || items.length > 0}
              className="px-4 py-2 bg-[#1D5D4C] text-white text-xs font-semibold rounded-lg hover:bg-[#154639] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {seeding && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{seeding ? 'Seeding Gallery...' : 'Seed Default Gallery Items'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item, index) => {
            const albumImages = item.gallery_item_images || [];
            const coverImg = albumImages.find(img => img.is_cover) || albumImages[0];
            const coverPath = coverImg?.storage_path || item.storage_path;
            const coverUrl = getGalleryImageUrl(coverPath);
            const totalPhotoCount = albumImages.length > 0 ? albumImages.length : (item.storage_path ? 1 : 0);

            return (
              <div
                key={item.id}
                className={`rounded-xl border overflow-hidden flex flex-col justify-between group transition-all ${
                  item.is_published 
                    ? 'bg-white border-[#DCD3C1] shadow-xs' 
                    : 'bg-slate-50 border-slate-300 opacity-60'
                }`}
              >
                {/* Thumbnail View */}
                <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div 
                      className={`w-full h-full flex items-center justify-center text-white text-xs font-semibold ph ${item.color_class || 'ph--forest'}`}
                    >
                      {item.title}
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="bg-[#1D5D4C]/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                      {item.category}
                    </span>
                    {!item.is_published && (
                      <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Hidden
                      </span>
                    )}
                  </div>

                  {/* Photo Count Badge */}
                  <div className="absolute top-2.5 right-2.5 bg-black/65 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/10">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{totalPhotoCount} {totalPhotoCount === 1 ? 'photo' : 'photos'}</span>
                  </div>

                  {/* Album Reorder Arrows */}
                  <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleMoveItemOrder(index, 'up')}
                      disabled={index === 0}
                      title="Move album earlier"
                      className="w-6 h-6 rounded-full bg-black/60 hover:bg-[#1D5D4C] text-white flex items-center justify-center backdrop-blur-xs disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMoveItemOrder(index, 'down')}
                      disabled={index === items.length - 1}
                      title="Move album later"
                      className="w-6 h-6 rounded-full bg-black/60 hover:bg-[#1D5D4C] text-white flex items-center justify-center backdrop-blur-xs disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Album Details & Actions */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-serif font-bold text-base text-[#2A2620] line-clamp-1" title={item.title}>
                        {item.title}
                      </h4>
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setShowEditItemModal(true);
                        }}
                        className="text-[#7D766A] hover:text-[#1D5D4C] p-1 rounded cursor-pointer"
                        title="Edit album title / category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-[#7D766A] mt-1 line-clamp-1">
                      {coverImg?.description || `Category: ${item.category}`}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#EFE8D9] flex items-center justify-between gap-2">
                    {/* Photos modal trigger */}
                    <button
                      onClick={() => {
                        setSelectedItemForPhotos(item);
                        // Initialize description draft values
                        const draftMap: Record<string, string> = {};
                        (item.gallery_item_images || []).forEach(img => {
                          draftMap[img.id] = img.description || '';
                        });
                        setEditingDescriptions(draftMap);
                        setShowPhotoModal(true);
                      }}
                      className="px-3 py-1.5 bg-[#1D5D4C] hover:bg-[#16473a] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Photos ({totalPhotoCount})</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePublish(item)}
                        className={`text-[11px] font-semibold px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
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
                        onClick={() => handleDeleteItem(item)}
                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete album"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MULTI-PHOTO ALBUM MANAGEMENT MODAL */}
      {showPhotoModal && selectedItemForPhotos && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-[#DCD3C1] max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#DCD3C1] pb-4 mb-4">
              <div>
                <span className="text-[11px] font-bold text-[#1D5D4C] uppercase tracking-wider">
                  Album Photo Manager &middot; {selectedItemForPhotos.category}
                </span>
                <h3 className="text-xl font-bold font-serif text-[#2A2620]">
                  Photos for &ldquo;{selectedItemForPhotos.title}&rdquo;
                </h3>
              </div>
              <button 
                onClick={() => {
                  setShowPhotoModal(false);
                  setSelectedItemForPhotos(null);
                }}
                className="text-[#7D766A] hover:text-[#2A2620] p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-1">
              {/* Upload Box */}
              <div className="bg-[#FAF7F2] p-5 rounded-xl border border-dashed border-[#1D5D4C]/40 text-center">
                <input
                  ref={multiFileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleUploadPhotosToAlbum}
                  className="hidden"
                />
                <UploadCloud className="w-8 h-8 text-[#1D5D4C] mx-auto mb-2" />
                <h4 className="text-sm font-bold text-[#2A2620]">Upload New Photos to this Album</h4>
                <p className="text-xs text-[#7D766A] mt-1 max-w-md mx-auto">
                  Select one or multiple photos to upload into the <code className="bg-white px-1 py-0.5 rounded border border-[#DCD3C1]">gallery-images</code> bucket.
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => multiFileInputRef.current?.click()}
                    disabled={uploadingAlbumPhotos}
                    className="px-4 py-2 bg-[#1D5D4C] hover:bg-[#16473a] text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {uploadingAlbumPhotos ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Uploading Photos...
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        Choose Photos to Upload
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Photos List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-[#2A2620] uppercase tracking-wide">
                    Album Photos ({selectedItemForPhotos.gallery_item_images?.length || 0})
                  </h4>
                  <span className="text-xs text-[#7D766A]">
                    Reorder photos or update captions individually
                  </span>
                </div>

                {(!selectedItemForPhotos.gallery_item_images || selectedItemForPhotos.gallery_item_images.length === 0) ? (
                  <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-sm text-[#7D766A]">No multi-photos added to this album yet.</p>
                    {selectedItemForPhotos.storage_path && (
                      <p className="text-xs text-[#1D5D4C] mt-1">
                        Currently using the legacy cover photo from initial property seeding. Upload photos above to add unlimited gallery views.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedItemForPhotos.gallery_item_images.map((photo, pIdx) => {
                      const photoUrl = getGalleryImageUrl(photo.storage_path);
                      const isSavingThis = savingDescId === photo.id;
                      const currentDescDraft = editingDescriptions[photo.id] ?? (photo.description || '');

                      return (
                        <div 
                          key={photo.id}
                          className={`bg-white rounded-xl border overflow-hidden flex flex-col justify-between shadow-xs ${
                            photo.is_cover ? 'border-[#C59B27] ring-2 ring-[#C59B27]/20' : 'border-[#DCD3C1]'
                          }`}
                        >
                          {/* Image preview with cover badge */}
                          <div className="relative aspect-[4/3] bg-black/5 overflow-hidden">
                            {photoUrl ? (
                              <img 
                                src={photoUrl} 
                                alt={photo.description || `Photo ${pIdx + 1}`}
                                className="w-full h-full object-cover" 
                              />
                            ) : null}

                            {/* Cover Badge */}
                            {photo.is_cover ? (
                              <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#C59B27] text-white flex items-center gap-1 shadow-xs">
                                <Star className="w-3 h-3 fill-white" /> Cover Photo
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSetCoverPhoto(photo.id, selectedItemForPhotos.id)}
                                className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-black/60 hover:bg-[#C59B27] text-white flex items-center gap-1 backdrop-blur-xs transition-colors cursor-pointer"
                              >
                                Set as Cover
                              </button>
                            )}

                            {/* Reorder Arrows */}
                            <div className="absolute top-2 right-2 flex items-center gap-1">
                              <button
                                onClick={() => handleMovePhotoOrder(pIdx, 'up')}
                                disabled={pIdx === 0}
                                title="Move photo earlier"
                                className="w-6 h-6 rounded-full bg-black/60 hover:bg-[#1D5D4C] text-white flex items-center justify-center backdrop-blur-xs disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleMovePhotoOrder(pIdx, 'down')}
                                disabled={pIdx === (selectedItemForPhotos.gallery_item_images?.length || 0) - 1}
                                title="Move photo later"
                                className="w-6 h-6 rounded-full bg-black/60 hover:bg-[#1D5D4C] text-white flex items-center justify-center backdrop-blur-xs disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Description Input & Actions */}
                          <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-[#7D766A] tracking-wider mb-1">
                                Photo Description / Caption
                              </label>
                              <input
                                type="text"
                                value={currentDescDraft}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditingDescriptions(prev => ({ ...prev, [photo.id]: val }));
                                }}
                                onBlur={() => {
                                  if (currentDescDraft !== (photo.description || '')) {
                                    handleSavePhotoDescription(photo.id);
                                  }
                                }}
                                placeholder="Caption for this photo..."
                                className="w-full px-2.5 py-1.5 border border-[#DCD3C1] rounded text-xs focus:outline-none focus:border-[#1D5D4C]"
                              />
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-[#EFE8D9]">
                              <button
                                type="button"
                                onClick={() => handleSavePhotoDescription(photo.id)}
                                disabled={isSavingThis || currentDescDraft === (photo.description || '')}
                                className="text-[11px] font-bold text-[#1D5D4C] hover:text-[#16473a] disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                              >
                                {isSavingThis ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                Save Caption
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeletePhoto(photo)}
                                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 cursor-pointer"
                                title="Delete this photo"
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
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-4 pt-3 border-t border-[#DCD3C1] flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowPhotoModal(false);
                  setSelectedItemForPhotos(null);
                }}
                className="px-5 py-2 text-xs font-bold bg-[#1D5D4C] hover:bg-[#16473a] text-white rounded-lg transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW ALBUM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#DCD3C1]">
            <div className="flex items-center justify-between border-b border-[#EFE8D9] pb-3 mb-4">
              <h3 className="text-lg font-serif font-bold text-[#1D5D4C]">
                Create New Gallery Album
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#6E6559] hover:text-[#2A2620] text-lg font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUploadNewAlbum} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                  Album Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Garden Pavilion & Fountain"
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

              {/* Initial Photo (optional) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                  Cover Photo (Optional)
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#1D5D4C]/40 rounded-xl p-4 text-center cursor-pointer hover:bg-[#FBF9F5] transition-colors"
                >
                  {filePreview ? (
                    <div className="relative aspect-video max-h-36 mx-auto overflow-hidden rounded-lg">
                      <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="py-2">
                      <UploadCloud className="w-7 h-7 text-[#1D5D4C] mx-auto mb-1" />
                      <p className="text-xs font-semibold text-[#2A2620]">Click to choose initial cover image</p>
                      <p className="text-[11px] text-[#6E6559]">JPG, PNG, or WEBP</p>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setSelectedFile(file);
                      setFilePreview(URL.createObjectURL(file));
                    }}
                    className="hidden"
                  />
                </div>
              </div>

              {selectedFile && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                    Cover Photo Description (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Scenic entrance view surrounded by lush palms"
                    value={newPhotoDesc}
                    onChange={(e) => setNewPhotoDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C]"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EFE8D9]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#DCD3C1] rounded-lg text-[#6E6559] hover:bg-[#F4EFE6] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !newTitle.trim()}
                  className="px-5 py-2 bg-[#1D5D4C] text-white rounded-lg font-medium hover:bg-[#154639] disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {uploading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{uploading ? 'Creating Album...' : 'Create Album'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ALBUM DETAILS MODAL */}
      {showEditItemModal && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#DCD3C1]">
            <div className="flex items-center justify-between border-b border-[#EFE8D9] pb-3 mb-4">
              <h3 className="text-lg font-serif font-bold text-[#1D5D4C]">
                Edit Album Details
              </h3>
              <button
                onClick={() => {
                  setShowEditItemModal(false);
                  setEditingItem(null);
                }}
                className="text-[#6E6559] hover:text-[#2A2620] text-lg font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveItemDetails} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                  Album Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                  Category *
                </label>
                <select
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
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
                  onClick={() => {
                    setShowEditItemModal(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 border border-[#DCD3C1] rounded-lg text-[#6E6559] hover:bg-[#F4EFE6] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1D5D4C] text-white rounded-lg font-medium hover:bg-[#154639] cursor-pointer"
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
