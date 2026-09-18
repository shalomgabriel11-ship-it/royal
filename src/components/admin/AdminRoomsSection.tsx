import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase, getRoomImageUrl } from '../../lib/supabase';
import { useHotelData } from '../../context/HotelDataContext';
import { 
  BedDouble, 
  Edit3, 
  UploadCloud, 
  Image as ImageIcon, 
  Trash2, 
  RefreshCw, 
  Check, 
  Star, 
  DollarSign, 
  Users, 
  Layers, 
  Plus, 
  X,
  AlertCircle
} from 'lucide-react';

export interface RoomImageRow {
  id: string;
  room_id: string;
  storage_path: string;
  sort_order: number;
  is_cover: boolean;
}

export interface AdminRoomRow {
  id: string;
  slug: string;
  name: string;
  category: string;
  capacity_label?: string | null;
  price_tzs?: number | null;
  total_units: number;
  description?: string | null;
  tags?: string[] | null;
  amenities?: string[] | null;
  color_class?: string | null;
  sort_order?: number;
  is_active: boolean;
  room_images?: RoomImageRow[];
}

export const AdminRoomsSection: React.FC = () => {
  const { refreshRooms } = useHotelData();
  const [rooms, setRooms] = useState<AdminRoomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoomForPhotos, setSelectedRoomForPhotos] = useState<AdminRoomRow | null>(null);
  const [editingRoom, setEditingRoom] = useState<AdminRoomRow | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [savingRoom, setSavingRoom] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states for editing
  const [amenitiesText, setAmenitiesText] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [isPriceOnRequest, setIsPriceOnRequest] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const fetchRoomsData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *,
          room_images (
            id,
            room_id,
            storage_path,
            sort_order,
            is_cover
          )
        `)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setRooms(data || []);

      // If photo modal is open, refresh selected room's images
      if (selectedRoomForPhotos) {
        const updated = (data || []).find(r => r.id === selectedRoomForPhotos.id);
        if (updated) setSelectedRoomForPhotos(updated);
      }
    } catch (err: any) {
      console.error('Error fetching rooms:', err);
      showToast(err?.message || 'Failed to fetch rooms', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomsData();
  }, []);

  const handleToggleRoomActive = async (room: AdminRoomRow) => {
    const newActive = !room.is_active;
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ is_active: newActive })
        .eq('id', room.id);

      if (error) throw error;
      setRooms(prev => prev.map(r => r.id === room.id ? { ...r, is_active: newActive } : r));
      showToast(`Room "${room.name}" is now ${newActive ? 'active' : 'hidden'}`);
      refreshRooms();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update active state', 'error');
    }
  };

  const handleOpenEdit = (room: AdminRoomRow) => {
    setEditingRoom(room);
    setAmenitiesText((room.amenities || []).join('\n'));
    setTagsText((room.tags || []).join(', '));
    setIsPriceOnRequest(room.price_tzs === null || room.price_tzs === undefined);
    setShowEditModal(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;

    setSavingRoom(true);
    const parsedAmenities = amenitiesText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const parsedTags = tagsText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const finalPrice = isPriceOnRequest ? null : (Number(editingRoom.price_tzs) || null);

    try {
      const { error } = await supabase
        .from('rooms')
        .update({
          name: editingRoom.name.trim(),
          category: editingRoom.category.trim(),
          price_tzs: finalPrice,
          total_units: Number(editingRoom.total_units) || 1,
          capacity_label: editingRoom.capacity_label?.trim() || null,
          description: editingRoom.description?.trim() || null,
          amenities: parsedAmenities,
          tags: parsedTags,
          is_active: editingRoom.is_active
        })
        .eq('id', editingRoom.id);

      if (error) throw error;

      showToast(`Room "${editingRoom.name}" updated successfully!`);
      setShowEditModal(false);
      fetchRoomsData();
      refreshRooms();
    } catch (err: any) {
      console.error('Error saving room:', err);
      showToast(err?.message || 'Failed to save room details', 'error');
    } finally {
      setSavingRoom(false);
    }
  };

  const handleOpenPhotos = (room: AdminRoomRow) => {
    setSelectedRoomForPhotos(room);
    setShowPhotoModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedRoomForPhotos) return;

    setUploading(true);
    const room = selectedRoomForPhotos;
    const existingImages = room.room_images || [];

    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop() || 'jpg';
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `rooms/${room.slug || room.id}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${cleanName}`;

      try {
        // Upload directly to 'room-images' Storage bucket
        const { error: uploadErr } = await supabase.storage
          .from('room-images')
          .upload(storagePath, file, { cacheControl: '3600', upsert: true });

        if (uploadErr) throw uploadErr;

        // Insert matching row into room_images table
        const nextOrder = existingImages.length + i + 1;
        const isCover = existingImages.length === 0 && i === 0;

        const { error: dbErr } = await supabase
          .from('room_images')
          .insert({
            room_id: room.id,
            storage_path: storagePath,
            sort_order: nextOrder,
            is_cover: isCover
          });

        if (dbErr) throw dbErr;
        successCount++;
      } catch (err: any) {
        console.error('Error uploading photo:', err);
        showToast(`Failed uploading ${file.name}: ${err?.message || 'Storage error'}`, 'error');
      }
    }

    if (successCount > 0) {
      showToast(`Uploaded ${successCount} new room photo(s) to 'room-images' bucket!`);
      await fetchRoomsData();
      refreshRooms();
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSetCover = async (imageId: string, roomId: string) => {
    try {
      // Set all other images for this room to is_cover: false
      await supabase
        .from('room_images')
        .update({ is_cover: false })
        .eq('room_id', roomId);

      // Set this image as is_cover: true
      const { error } = await supabase
        .from('room_images')
        .update({ is_cover: true })
        .eq('id', imageId);

      if (error) throw error;

      showToast('Set photo as main cover');
      await fetchRoomsData();
      refreshRooms();
    } catch (err: any) {
      showToast(err?.message || 'Failed to set cover photo', 'error');
    }
  };

  const handleDeletePhoto = async (imageId: string, storagePath: string) => {
    if (!window.confirm('Delete this room photo permanently?')) return;
    try {
      // Delete db row
      const { error: dbErr } = await supabase
        .from('room_images')
        .delete()
        .eq('id', imageId);

      if (dbErr) throw dbErr;

      // Delete from storage
      await supabase.storage.from('room-images').remove([storagePath]);

      showToast('Photo deleted');
      await fetchRoomsData();
      refreshRooms();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete photo', 'error');
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
            <BedDouble className="w-6 h-6 text-[#1D5D4C]" />
            Rooms Catalog &amp; Photo Management
          </h2>
          <p className="text-sm text-[#6E6559] mt-0.5">
            Manage room pricing, unit availability, descriptions, and upload distinct room photos directly to the storage bucket.
          </p>
        </div>
        <button
          onClick={fetchRoomsData}
          disabled={loading}
          className="px-3.5 py-2 text-sm font-medium text-[#2A2620] bg-[#F4EFE6] hover:bg-[#EAE2D2] rounded-lg border border-[#DCD3C1] transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#1D5D4C]' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Rooms List */}
      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-[#DCD3C1] text-center text-[#6E6559]">
          <RefreshCw className="w-8 h-8 animate-spin text-[#1D5D4C] mx-auto mb-2" />
          <p className="text-sm">Loading 8 rooms and image metadata from Supabase...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {rooms.map((room) => {
            const imageCount = room.room_images?.length || 0;
            const coverImage = room.room_images?.find(img => img.is_cover) || room.room_images?.[0];
            const coverUrl = coverImage ? getRoomImageUrl(coverImage.storage_path) : null;

            return (
              <div
                key={room.id}
                className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                  room.is_active 
                    ? 'bg-white border-[#DCD3C1]/80 shadow-xs' 
                    : 'bg-slate-50 border-slate-300 opacity-60'
                }`}
              >
                <div>
                  {/* Top row with category badge & active status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 bg-[#1D5D4C] text-[#F4EFE6] rounded-full">
                        {room.category}
                      </span>
                      <span className="text-xs text-[#6E6559]">
                        {room.total_units} unit{room.total_units > 1 ? 's' : ''}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleRoomActive(room)}
                      className={`text-xs px-2.5 py-0.5 rounded font-semibold transition-colors ${
                        room.is_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {room.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  {/* Room name & preview */}
                  <div className="flex gap-4">
                    {/* Thumbnail preview */}
                    <div className="w-24 h-24 rounded-lg bg-[#EFE8D9] border border-[#DCD3C1] overflow-hidden shrink-0 relative flex items-center justify-center">
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt={room.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-[#DCD3C1]" />
                      )}
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {imageCount} 📷
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif font-bold text-lg text-[#2A2620] truncate">
                        {room.name}
                      </h3>
                      <div className="text-xs text-[#6E6559] mt-0.5">
                        Capacity: <span className="font-semibold text-[#2A2620]">{room.capacity_label || '2 Guests'}</span>
                      </div>
                      <div className="text-sm font-bold text-[#1D5D4C] mt-1">
                        {room.price_tzs !== null && room.price_tzs !== undefined
                          ? `TZS ${Number(room.price_tzs).toLocaleString()} / night`
                          : 'Price on Request'}
                      </div>
                      <p className="text-xs text-[#6E6559] mt-1 line-clamp-2">
                        {room.description}
                      </p>
                    </div>
                  </div>

                  {/* Amenities preview */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {(room.amenities || []).slice(0, 4).map((amenity, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 bg-[#FBF9F5] text-[#6E6559] rounded border border-[#EFE8D9]">
                        {amenity}
                      </span>
                    ))}
                    {(room.amenities || []).length > 4 && (
                      <span className="text-[11px] px-1.5 py-0.5 text-[#6E6559]">
                        +{room.amenities!.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions bottom bar */}
                <div className="mt-4 pt-3 border-t border-[#EFE8D9] flex items-center justify-between gap-2">
                  <span className="text-xs text-[#6E6559] font-mono">
                    slug: {room.slug}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenPhotos(room)}
                      className="px-3 py-1.5 text-xs font-semibold bg-[#F4EFE6] hover:bg-[#EAE2D2] text-[#1D5D4C] rounded-lg border border-[#DCD3C1] flex items-center gap-1.5"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Photos ({imageCount})</span>
                    </button>
                    <button
                      onClick={() => handleOpenEdit(room)}
                      className="px-3 py-1.5 text-xs font-semibold bg-[#1D5D4C] hover:bg-[#154639] text-white rounded-lg flex items-center gap-1.5 shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Details</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Room Modal */}
      {showEditModal && editingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#DCD3C1] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EFE8D9] pb-3 mb-4">
              <h3 className="text-xl font-serif font-bold text-[#1D5D4C]">
                Edit Room: {editingRoom.name}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-[#6E6559] hover:text-[#2A2620] text-lg font-bold p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                  Room Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingRoom.name}
                  onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                    Category *
                  </label>
                  <select
                    value={editingRoom.category}
                    onChange={(e) => setEditingRoom({ ...editingRoom, category: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C]"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Suite">Suite</option>
                    <option value="Superior">Superior</option>
                    <option value="Executive">Executive</option>
                    <option value="Apartment">Apartment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                    Total Units Available *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingRoom.total_units}
                    onChange={(e) => setEditingRoom({ ...editingRoom, total_units: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                  Price in Tanzanian Shillings (TZS)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    disabled={isPriceOnRequest}
                    placeholder="e.g. 250000"
                    value={editingRoom.price_tzs ?? ''}
                    onChange={(e) => setEditingRoom({ ...editingRoom, price_tzs: e.target.value ? Number(e.target.value) : null })}
                    className="flex-1 px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C] disabled:bg-gray-100"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-[#2A2620] cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={isPriceOnRequest}
                      onChange={(e) => {
                        setIsPriceOnRequest(e.target.checked);
                        if (e.target.checked) setEditingRoom({ ...editingRoom, price_tzs: null });
                      }}
                      className="rounded text-[#1D5D4C]"
                    />
                    <span>Price on Request</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                  Capacity Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2 Guests or 2 Guests + Kitchenette"
                  value={editingRoom.capacity_label || ''}
                  onChange={(e) => setEditingRoom({ ...editingRoom, capacity_label: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                  Room Description
                </label>
                <textarea
                  rows={3}
                  value={editingRoom.description || ''}
                  onChange={(e) => setEditingRoom({ ...editingRoom, description: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                  Amenities (one per line)
                </label>
                <textarea
                  rows={4}
                  value={amenitiesText}
                  onChange={(e) => setAmenitiesText(e.target.value)}
                  placeholder="King-size Bed&#10;Private Balcony&#10;Free Breakfast&#10;Air Conditioning"
                  className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C] font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Free breakfast, Pool access, King Bed"
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="room-active"
                  checked={editingRoom.is_active}
                  onChange={(e) => setEditingRoom({ ...editingRoom, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-[#1D5D4C]"
                />
                <label htmlFor="room-active" className="text-xs font-medium text-[#2A2620]">
                  Active on website (guests can see and book this room)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EFE8D9]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-[#DCD3C1] rounded-lg text-[#6E6559] hover:bg-[#F4EFE6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRoom}
                  className="px-5 py-2 bg-[#1D5D4C] text-white rounded-lg font-medium hover:bg-[#154639] disabled:opacity-50"
                >
                  {savingRoom ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Photos Modal */}
      {showPhotoModal && selectedRoomForPhotos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#DCD3C1] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EFE8D9] pb-3 mb-4">
              <div>
                <h3 className="text-xl font-serif font-bold text-[#1D5D4C]">
                  Photos for {selectedRoomForPhotos.name}
                </h3>
                <p className="text-xs text-[#6E6559] mt-0.5">
                  Direct upload to the <code className="bg-gray-100 px-1 rounded">room-images</code> Storage bucket and <code className="bg-gray-100 px-1 rounded">room_images</code> table.
                </p>
              </div>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="text-[#6E6559] hover:text-[#2A2620] text-lg font-bold p-1"
              >
                &times;
              </button>
            </div>

            {/* Upload Box */}
            <div className="p-5 border-2 border-dashed border-[#1D5D4C]/40 rounded-xl bg-[#FBF9F5] text-center mb-6">
              <UploadCloud className="w-10 h-10 text-[#1D5D4C] mx-auto mb-2" />
              <div className="text-sm font-semibold text-[#2A2620]">
                Upload Room Photos
              </div>
              <p className="text-xs text-[#6E6559] max-w-xs mx-auto mt-1 mb-3">
                PNG, JPG, or WEBP. Upload high-res photos to display in the guest booking gallery.
              </p>
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                id="room-photo-upload"
              />
              <label
                htmlFor="room-photo-upload"
                className={`inline-flex items-center gap-1.5 px-4 py-2 bg-[#1D5D4C] text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-[#154639] transition-colors ${
                  uploading ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading to Storage...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Choose Images to Upload</span>
                  </>
                )}
              </label>
            </div>

            {/* Existing Photos Grid */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#6E6559] flex items-center justify-between">
                <span>Current Photos ({(selectedRoomForPhotos.room_images || []).length})</span>
                <span className="text-[11px] font-normal lowercase">First photo or starred item is main cover</span>
              </div>

              {(selectedRoomForPhotos.room_images || []).length === 0 ? (
                <div className="p-8 text-center text-[#6E6559] bg-[#F4EFE6]/50 rounded-xl border border-[#DCD3C1]">
                  <ImageIcon className="w-8 h-8 text-[#DCD3C1] mx-auto mb-2" />
                  <p className="text-sm font-serif">No distinct photos uploaded for this room yet</p>
                  <p className="text-xs mt-1">Upload photos above so this room displays real interior images instead of defaults.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(selectedRoomForPhotos.room_images || []).map((img) => {
                    const url = getRoomImageUrl(img.storage_path);
                    return (
                      <div
                        key={img.id}
                        className={`relative rounded-xl overflow-hidden border group bg-black/5 ${
                          img.is_cover ? 'ring-2 ring-[#C59B27] border-[#C59B27]' : 'border-[#DCD3C1]'
                        }`}
                      >
                        <div className="aspect-4/3 w-full overflow-hidden bg-gray-100">
                          {url && (
                            <img
                              src={url}
                              alt="Room view"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          )}
                        </div>

                        {img.is_cover && (
                          <div className="absolute top-2 left-2 bg-[#C59B27] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" /> Cover
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                          {!img.is_cover && (
                            <button
                              onClick={() => handleSetCover(img.id, selectedRoomForPhotos.id)}
                              className="px-2 py-1 bg-white/90 hover:bg-white text-[#2A2620] text-[11px] font-semibold rounded shadow"
                              title="Set as main cover"
                            >
                              Set Cover
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePhoto(img.id, img.storage_path)}
                            className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded shadow"
                            title="Delete photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#EFE8D9] flex justify-end">
              <button
                onClick={() => setShowPhotoModal(false)}
                className="px-5 py-2 bg-[#1D5D4C] text-white rounded-lg text-sm font-medium hover:bg-[#154639]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
