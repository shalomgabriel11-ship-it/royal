import React, { useState } from 'react';
import { PageView, ReviewItem } from '../types';
import { REVIEWS } from '../data';

interface ReviewsViewProps {
  setActivePage: (page: PageView) => void;
}

export const ReviewsView: React.FC<ReviewsViewProps> = ({ setActivePage }) => {
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>(REVIEWS);
  const [newReview, setNewReview] = useState({
    name: '',
    tripType: 'Leisure stay',
    rating: 5,
    comment: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.name || !newReview.comment) return;

    const item: ReviewItem = {
      id: Date.now().toString(),
      name: newReview.name,
      tripType: newReview.tripType,
      rating: Number(newReview.rating),
      date: 'Just now',
      comment: newReview.comment
    };

    setReviewsList([item, ...reviewsList]);
    setSubmitted(true);
    setNewReview({ name: '', tripType: 'Leisure stay', rating: 5, comment: '' });
  };

  return (
    <div className="section">
      <div className="container">
        <div className="page-header">
          <span className="eyebrow">Guest Experiences</span>
          <h1>Guest Reviews</h1>
          <p className="lede">
            Real experiences from travelers, business executives, and families who have stayed with us at Royal Mgwasi Hotel in Mbeya.
          </p>
        </div>

        {/* Rating Overview Card */}
        <div className="grid grid--2 mb-12">
          <div className="rating-card flex flex-col justify-between">
            <div>
              <div className="rating-card__score">
                4.3
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.2-5.4 3.2 1.3-6-4.6-4.1 6.1-.6z"/></svg>
              </div>
              <h3 className="text-white text-xl mt-2 font-serif">Very Good &middot; 118 Verified Google Reviews</h3>
              <p>Based on ratings for cleanliness, staff friendliness, delicious food, and convenient Forest Mpya location.</p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#322E28] text-xs text-[#B9B2A5]">
              Forest Mpya, Mbeya &middot; Official Google Business Rating
            </div>
          </div>

          <div className="form-panel">
            <h3 className="text-xl font-serif text-[#2A2620] mb-2">Leave a Guest Review</h3>
            <p className="text-xs text-[#6E6559] mb-4">Did you stay with us recently? We appreciate your honest feedback.</p>

            <form onSubmit={handleAddReview}>
              <div className="field-row">
                <div className="field">
                  <label>Your Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. David B."
                    value={newReview.name}
                    onChange={e => setNewReview({...newReview, name: e.target.value})}
                  />
                </div>
                <div className="field">
                  <label>Rating</label>
                  <select 
                    value={newReview.rating}
                    onChange={e => setNewReview({...newReview, rating: Number(e.target.value)})}
                  >
                    <option value={5}>★★★★★ (5/5 Excellent)</option>
                    <option value={4}>★★★★☆ (4/5 Very Good)</option>
                    <option value={3}>★★★☆☆ (3/5 Average)</option>
                  </select>
                </div>
              </div>

              <div className="field mt-3">
                <label>Trip Type</label>
                <select 
                  value={newReview.tripType}
                  onChange={e => setNewReview({...newReview, tripType: e.target.value})}
                >
                  <option value="Leisure stay">Leisure stay</option>
                  <option value="Business trip">Business trip</option>
                  <option value="Family holiday">Family holiday</option>
                  <option value="Weekend getaway">Weekend getaway</option>
                </select>
              </div>

              <div className="field mt-3">
                <label>Your Review Comment *</label>
                <textarea 
                  rows={3} 
                  required
                  placeholder="Share details of your room, meals, or staff service..."
                  value={newReview.comment}
                  onChange={e => setNewReview({...newReview, comment: e.target.value})}
                ></textarea>
              </div>

              {submitted && (
                <div className="form-success is-visible my-3">
                  Thank you! Your review has been added below.
                </div>
              )}

              <button type="submit" className="btn btn--primary btn--block mt-4">
                Submit Review
              </button>
            </form>
          </div>
        </div>

        {/* Reviews List */}
        <h2 className="text-2xl font-serif mb-6">Recent Guest Comments</h2>
        <div className="grid grid--3">
          {reviewsList.map((rev) => (
            <article key={rev.id} className="testimonial flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="testimonial__name">{rev.name}</div>
                  <span className="text-xs text-[#6E6559]">{rev.date}</span>
                </div>
                <div className="testimonial__trip">{rev.tripType}</div>
                <div className="testimonial__stars">
                  {'★'.repeat(rev.rating)}
                </div>
                <p className="mt-3">{rev.comment}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center mt-12">
          <button onClick={() => setActivePage('book')} className="btn btn--primary btn--lg">
            Ready for your stay? Book Now &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
