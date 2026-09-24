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
  | 'book'
  | 'account';

export interface RoomOption {
  id: string;
  slug?: string;
  name: string;
  category: string;
  capacity: string;
  price: string;
  price_tzs?: number | null;
  tags: string[];
  description: string;
  colorClass: string;
  amenities: string[];
  image?: string;
  images?: string[];
  units?: number;
}

export interface ReviewItem {
  id: string;
  name: string;
  tripType: string;
  rating: number;
  date: string;
  comment: string;
  is_published?: boolean;
}

export interface OfferItem {
  id: string;
  title: string;
  badge: string;
  description: string;
  perks: string[];
  priceNote: string;
  members_only?: boolean;
}

export interface MemberProfile {
  id: string;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  joined_at?: string;
  is_active?: boolean;
}

export interface HeroSlide {
  id: string;
  storage_path: string;
  description?: string | null;
  sort_order: number;
  is_active: boolean;
  image_url?: string;
  created_at?: string;
}

export interface GalleryItemImage {
  id: string;
  gallery_item_id: string;
  storage_path: string;
  description?: string | null;
  sort_order: number;
  is_cover: boolean;
  image_url?: string;
  created_at?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  colorClass: string;
  storage_path?: string | null;
  image?: string;
  images?: string[];
  gallery_images?: GalleryItemImage[];
  is_published?: boolean;
}

export interface LandmarkItem {
  name: string;
  distance: string;
  note: string;
}
