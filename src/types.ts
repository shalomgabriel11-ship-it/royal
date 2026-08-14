export type PageView = 
  | 'home'
  | 'rooms'
  | 'dining'
  | 'gallery'
  | 'offers'
  | 'events'
  | 'our-story'
  | 'reviews'
  | 'contact'
  | 'book';

export interface RoomOption {
  id: string;
  name: string;
  category: string;
  capacity: string;
  price: string;
  tags: string[];
  description: string;
  colorClass: string;
  amenities: string[];
  image?: string;
  images?: string[];
}

export interface ReviewItem {
  id: string;
  name: string;
  tripType: string;
  rating: number;
  date: string;
  comment: string;
}

export interface OfferItem {
  id: string;
  title: string;
  badge: string;
  description: string;
  perks: string[];
  priceNote: string;
}
