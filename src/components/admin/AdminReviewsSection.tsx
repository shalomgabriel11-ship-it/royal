import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useHotelData } from '../../context/HotelDataContext';
import { 
  Star, 
  Eye, 
  EyeOff, 
  Trash2, 
  RefreshCw, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Search,
  Filter
} from 'lucide-react';

export interface ReviewRow {
  id: string;
  guest_name: string;
  trip_type?: string | null;
  rating: number;
  comment: string;
  is_published: boolean;
  created_at: string;
}

export const AdminReviewsSection: React.FC = () => {
  const { refreshReviews } = useHotelData();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'published'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New review form
  const [newReview, setNewReview] = useState({
    guest_name: '',
    trip_type: 'Verified Guest',
    rating: 5,
    comment: '',
    is_published: true
  });
  const [savingNew, setSavingNew] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const fetchReviewsData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
      showToast(err?.message || 'Failed to fetch reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewsData();
  }, []);

  const handleTogglePublish = async (review: ReviewRow) => {
    setTogglingId(review.id);
    const newStatus = !review.is_published;
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_published: newStatus })
        .eq('id', review.id);

      if (error) throw error;

      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, is_published: newStatus } : r));
      showToast(newStatus ? 'Review published to public website!' : 'Review unpublished (hidden from public)');
      
      // Refresh public context
      refreshReviews();
    } catch (err: any) {
      console.error('Error updating review status:', err);
      showToast(err?.message || 'Failed to update review status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
      setReviews(prev => prev.filter(r => r.id !== id));
      showToast('Review deleted');
      refreshReviews();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete review', 'error');
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.guest_name.trim() || !newReview.comment.trim()) {
      showToast('Please provide guest name and comment', 'error');
      return;
    }

    setSavingNew(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([
          {
            guest_name: newReview.guest_name.trim(),
            trip_type: newReview.trip_type.trim() || 'Verified Guest',
            rating: Number(newReview.rating),
            comment: newReview.comment.trim(),
            is_published: newReview.is_published
          }
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setReviews(prev => [data, ...prev]);
      }
      showToast('Review created successfully');
      setShowAddModal(false);
      setNewReview({
        guest_name: '',
        trip_type: 'Verified Guest',
        rating: 5,
        comment: '',
        is_published: true
      });
      refreshReviews();
    } catch (err: any) {
      console.error('Error creating review:', err);
      showToast(err?.message || 'Failed to create review', 'error');
    } finally {
      setSavingNew(false);
    }
  };

  const stats = useMemo(() => {
    return {
      total: reviews.length,
      pending: reviews.filter(r => !r.is_published).length,
      published: reviews.filter(r => r.is_published).length,
    };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      if (filterMode === 'pending' && r.is_published) return false;
      if (filterMode === 'published' && !r.is_published) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.guest_name.toLowerCase().includes(q) ||
        (r.trip_type && r.trip_type.toLowerCase().includes(q)) ||
        r.comment.toLowerCase().includes(q)
      );
    });
  }, [reviews, filterMode, searchQuery]);

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

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#DCD3C1]/80 shadow-xs">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#1D5D4C] flex items-center gap-2">
            <Star className="w-6 h-6 text-[#C59B27] fill-[#C59B27]" />
            Guest Reviews &amp; Moderation
          </h2>
          <p className="text-sm text-[#6E6559] mt-0.5">
            Moderate submitted guest feedback before publishing to the public hotel reviews page.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchReviewsData}
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
            <span>Add Review</span>
          </button>
        </div>
      </div>

      {/* Filter and stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <button
          onClick={() => setFilterMode('all')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filterMode === 'all' 
              ? 'bg-[#1D5D4C]/10 border-[#1D5D4C] ring-2 ring-[#1D5D4C]/20' 
              : 'bg-white border-[#DCD3C1]/80 hover:border-[#1D5D4C]/50'
          }`}
        >
          <div className="text-xs uppercase font-bold tracking-wider text-[#6E6559]">Total Reviews</div>
          <div className="text-2xl font-bold font-serif text-[#2A2620] mt-1">{stats.total}</div>
        </button>

        <button
          onClick={() => setFilterMode('pending')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filterMode === 'pending' 
              ? 'bg-amber-100/70 border-amber-500 ring-2 ring-amber-400/30' 
              : 'bg-white border-[#DCD3C1]/80 hover:border-amber-400'
          }`}
        >
          <div className="text-xs uppercase font-bold tracking-wider text-amber-700 flex items-center justify-between">
            <span>Pending Moderation</span>
            {stats.pending > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            )}
          </div>
          <div className="text-2xl font-bold font-serif text-amber-800 mt-1">{stats.pending}</div>
        </button>

        <button
          onClick={() => setFilterMode('published')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filterMode === 'published' 
              ? 'bg-emerald-100/70 border-emerald-500 ring-2 ring-emerald-400/30' 
              : 'bg-white border-[#DCD3C1]/80 hover:border-emerald-400'
          }`}
        >
          <div className="text-xs uppercase font-bold tracking-wider text-emerald-700">Published Live</div>
          <div className="text-2xl font-bold font-serif text-emerald-800 mt-1">{stats.published}</div>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-3.5 rounded-xl border border-[#DCD3C1]/80 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-[#6E6559]" />
        <input
          type="text"
          placeholder="Filter reviews by guest name, trip type, or keyword in review text..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-sm bg-transparent border-none focus:outline-none text-[#2A2620]"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-xs text-[#6E6559] hover:text-[#2A2620]">
            Clear
          </button>
        )}
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-[#DCD3C1] text-center text-[#6E6559]">
          <RefreshCw className="w-8 h-8 animate-spin text-[#1D5D4C] mx-auto mb-2" />
          <p className="text-sm">Loading reviews from Supabase database...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-[#DCD3C1] text-center text-[#6E6559] space-y-2">
          <Star className="w-10 h-10 text-[#DCD3C1] mx-auto" />
          <p className="font-serif font-bold text-[#2A2620]">No reviews found</p>
          <p className="text-xs text-[#6E6559] max-w-sm mx-auto">
            {reviews.length === 0 ? 'No reviews exist in the database yet.' : 'No reviews match your filter search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className={`p-5 rounded-xl border transition-all ${
                review.is_published 
                  ? 'bg-white border-[#DCD3C1]/80 shadow-xs' 
                  : 'bg-amber-50/40 border-amber-300/80 shadow-xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[#2A2620] text-base">{review.guest_name}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F4EFE6] text-[#6E6559] border border-[#DCD3C1]">
                      {review.trip_type || 'Verified Guest'}
                    </span>
                    {review.is_published ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-600" /> Published
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" /> Pending Moderation
                      </span>
                    )}
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-1 mt-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating 
                            ? 'text-[#C59B27] fill-[#C59B27]' 
                            : 'text-[#DCD3C1]'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-[#6E6559] ml-2">
                      {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => handleTogglePublish(review)}
                    disabled={togglingId === review.id}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs ${
                      review.is_published
                        ? 'bg-[#F4EFE6] hover:bg-[#EAE2D2] text-[#6E6559] border border-[#DCD3C1]'
                        : 'bg-[#1D5D4C] hover:bg-[#154639] text-white'
                    }`}
                  >
                    {review.is_published ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Unpublish</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Publish to Site</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteReview(review.id)}
                    className="p-1.5 text-[#6E6559] hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                    title="Delete review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Review Text */}
              <p className="mt-3 text-sm text-[#2A2620] leading-relaxed italic bg-white/70 p-3 rounded-lg border border-[#EFE8D9]">
                "{review.comment}"
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add Review Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#DCD3C1]">
            <div className="flex items-center justify-between border-b border-[#EFE8D9] pb-3 mb-4">
              <h3 className="text-xl font-serif font-bold text-[#1D5D4C]">
                Add Verified Guest Review
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#6E6559] hover:text-[#2A2620] text-lg font-bold p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateReview} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                  Guest Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mary Temba"
                  value={newReview.guest_name}
                  onChange={(e) => setNewReview({ ...newReview, guest_name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                  Trip Type
                </label>
                <input
                  type="text"
                  placeholder="e.g. Business trip, Weekend stay, Family holiday"
                  value={newReview.trip_type}
                  onChange={(e) => setNewReview({ ...newReview, trip_type: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                  Rating (1 to 5 Stars) *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating: num })}
                      className="p-1 text-[#C59B27] hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          num <= newReview.rating 
                            ? 'text-[#C59B27] fill-[#C59B27]' 
                            : 'text-[#DCD3C1]'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-[#2A2620] ml-2">
                    {newReview.rating} / 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                  Review Comment *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Guest's review description..."
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pub-checkbox"
                  checked={newReview.is_published}
                  onChange={(e) => setNewReview({ ...newReview, is_published: e.target.checked })}
                  className="rounded text-[#1D5D4C] focus:ring-[#1D5D4C]"
                />
                <label htmlFor="pub-checkbox" className="text-xs font-medium text-[#2A2620]">
                  Publish immediately to public website
                </label>
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
                  disabled={savingNew}
                  className="px-5 py-2 bg-[#1D5D4C] text-white rounded-lg font-medium hover:bg-[#154639] disabled:opacity-50"
                >
                  {savingNew ? 'Saving...' : 'Add Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
