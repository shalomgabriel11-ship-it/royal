import { RoomOption, ReviewItem, OfferItem, GalleryItem, LandmarkItem } from './types';
import { supabase, getRoomImageUrl, getGalleryImageUrl } from './lib/supabase';

export const WHATSAPP_NUMBER = "255762555557";

export function formatWhatsAppUrl(message: string): string {
  const baseUrl = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${baseUrl}?text=${encodeURIComponent(message)}` : baseUrl;
}

export function formatRoomPrice(priceTzs: number | string | null | undefined): string {
  if (priceTzs === null || priceTzs === undefined || priceTzs === '') {
    return 'Price on Request';
  }
  const num = typeof priceTzs === 'number' ? priceTzs : parseFloat(priceTzs as string);
  if (isNaN(num)) return 'Price on Request';
  return `TZS ${num.toLocaleString()} / night`;
}

export const DEFAULT_ROOMS: RoomOption[] = [
  {
    id: 'junior-suite',
    slug: 'junior-suite',
    name: 'Junior Suite',
    category: 'Suite',
    capacity: '2 Guests',
    price: 'TZS 250,000 / night',
    price_tzs: 250000,
    units: 4,
    tags: ['Free breakfast', 'Pool access', 'Private Balcony', 'King Bed'],
    description: 'An expansive, beautifully appointed suite featuring a luxurious king bed, private balcony, and serene garden and pool views.',
    colorClass: 'ph--forest',
    amenities: ['King-size Bed', 'Private Balcony', 'Pool Access', 'Free Breakfast', 'Free Wi-Fi', 'En-suite Hot Shower', 'Air Conditioning'],
    images: []
  },
  {
    id: 'standard-twin-beds',
    slug: 'standard-twin-beds',
    name: 'Standard Twin Beds',
    category: 'Standard',
    capacity: '2 Guests (Twin)',
    price: 'Price on Request',
    price_tzs: null,
    units: 3,
    tags: ['Free breakfast', 'Free Wi-Fi', 'Free Parking', 'Twin Beds'],
    description: 'Comfortable and quiet room furnished with two separate twin beds, ideal for colleagues, friends, or travel companions.',
    colorClass: 'ph--slate',
    amenities: ['Two Twin Beds', 'Free Breakfast', 'Free Wi-Fi', 'Work Desk', 'Hot Shower', 'Daily Housekeeping'],
    images: []
  },
  {
    id: 'standard-double-room',
    slug: 'standard-double-room',
    name: 'Standard Double Room',
    category: 'Standard',
    capacity: '2 Guests',
    price: 'TZS 100,000 / night',
    price_tzs: 100000,
    units: 3,
    tags: ['Free breakfast', 'Free Wi-Fi', 'Free Parking', 'Double Bed'],
    description: 'Cozy and restful double accommodation equipped with en-suite hot shower, dedicated work desk, and fast Wi-Fi.',
    colorClass: 'ph--sand',
    amenities: ['Double Bed', 'Free Breakfast', 'Free Wi-Fi', 'Work Desk', 'En-suite Shower', 'Daily Housekeeping'],
    images: []
  },
  {
    id: 'superior-room',
    slug: 'superior-room',
    name: 'Superior Room',
    category: 'Superior',
    capacity: '2 Guests',
    price: 'TZS 200,000 / night',
    price_tzs: 200000,
    units: 15,
    tags: ['Free breakfast', 'Pool access', 'Free Wi-Fi', 'King Bed'],
    description: 'Elevated comfort with premium bedding, generous room layout, ambient lighting, and convenient access to the poolside.',
    colorClass: 'ph--olive',
    amenities: ['King-size Bed', 'Air Conditioning', 'Flat-screen TV', 'Free Breakfast', 'Free Wi-Fi', 'Hot Shower', 'Work Desk'],
    images: []
  },
  {
    id: 'executive-room',
    slug: 'executive-room',
    name: 'Executive Room',
    category: 'Executive',
    capacity: '2 Guests',
    price: 'TZS 220,000 / night',
    price_tzs: 220000,
    units: 6,
    tags: ['Free breakfast', 'Work Desk', 'Pool access', 'King Bed'],
    description: 'Tailored for corporate travelers and diplomats desiring executive workspace, refined finishes, and tranquil surroundings.',
    colorClass: 'ph--dusk',
    amenities: ['King-size Bed', 'Executive Work Desk', 'Air Conditioning', 'Free Breakfast', 'High-Speed Wi-Fi', 'En-suite Hot Shower', 'Room Service'],
    images: []
  },
  {
    id: 'one-bed-apartment',
    slug: 'one-bed-apartment',
    name: 'One Bed Apartment',
    category: 'Apartment',
    capacity: '2 Guests + Kitchenette',
    price: 'TZS 350,000 / night',
    price_tzs: 350000,
    units: 2,
    tags: ['Free breakfast', 'Kitchenette', 'Living Area', 'Free Parking'],
    description: 'Self-contained apartment featuring a separate bedroom, comfortable living room, and convenient kitchenette for extended stays.',
    colorClass: 'ph--brown',
    amenities: ['Double Bed', 'Kitchenette', 'Separate Living Area', 'Free Breakfast', 'Free Wi-Fi', 'Refrigerator', 'En-suite Bathroom'],
    images: []
  },
  {
    id: 'standard-studio-room',
    slug: 'standard-studio-room',
    name: 'Standard Studio Room',
    category: 'Standard',
    capacity: '2-3 Guests',
    price: 'TZS 150,000 / night',
    price_tzs: 150000,
    units: 18,
    tags: ['Free breakfast', 'Free Wi-Fi', 'Seating Area', 'Work Desk'],
    description: 'Open-plan studio offering flexible sleeping space, comfortable seating area, and seamless Wi-Fi connectivity.',
    colorClass: 'ph--green',
    amenities: ['Studio Bedding', 'Seating Lounge', 'Free Breakfast', 'Free Wi-Fi', 'Work Desk', 'Hot Shower', 'Daily Housekeeping'],
    images: []
  },
  {
    id: 'standard-deluxe-room',
    slug: 'standard-deluxe-room',
    name: 'Standard Deluxe Room',
    category: 'Standard',
    capacity: '2 Guests',
    price: 'TZS 120,000 / night',
    price_tzs: 120000,
    units: 3,
    tags: ['Free breakfast', 'Free Wi-Fi', 'Free Parking', 'Queen Bed'],
    description: 'Enhanced standard room offering extra square footage, plush mattress, smart workstation, and modern en-suite amenities.',
    colorClass: 'ph--sand',
    amenities: ['Queen-size Bed', 'Air Conditioning', 'Flat-screen TV', 'Free Breakfast', 'Free Wi-Fi', 'En-suite Shower', 'Work Desk'],
    images: []
  }
];

export const DEFAULT_REVIEWS: ReviewItem[] = [
  {
    id: '1',
    name: 'Thorsten Fink',
    tripType: 'Business trip',
    rating: 5,
    date: 'Recent Guest',
    comment: 'Rooms clean, staff friendly and the restaurant has amazing food. The tilapia was really great. A very solid place to stay in Mbeya!'
  },
  {
    id: '2',
    name: 'Yasira Mohamed',
    tripType: 'Family holiday',
    rating: 5,
    date: 'Recent Guest',
    comment: 'Clean, organised rooms with very pleasant staff who were very helpful—worth the value for the money paid.'
  },
  {
    id: '3',
    name: 'Jackson Stapher',
    tripType: 'Weekend stay',
    rating: 5,
    date: 'Recent Guest',
    comment: 'Cool place, live band every weekend—you get Royal services and great food by the poolside.'
  },
  {
    id: '4',
    name: 'Emmanuel M.',
    tripType: 'Corporate Traveler',
    rating: 5,
    date: '1 month ago',
    comment: 'Great location near Mzumbe University in Forest Mpya. Quiet atmosphere for working, excellent security and parking.'
  },
  {
    id: '5',
    name: 'Grace K.',
    tripType: 'Leisure stay',
    rating: 4,
    date: '2 months ago',
    comment: 'Wonderful hospitality! The tilapia dish in the restaurant lives up to the reputation. Rooms are spotless and quiet.'
  }
];

export const DEFAULT_OFFERS: OfferItem[] = [
  {
    id: 'weekend-escape',
    title: 'Weekend Live Music & Stay Package',
    badge: 'Popular',
    description: 'Enjoy a 2-night weekend stay inclusive of daily free breakfast and reserved VIP seating for our Fri-Sun live band performance.',
    perks: ['2 Nights Deluxe Room', 'Complimentary Breakfast', 'Reserved Live Band Seating', 'Late Check-out at 2:00 PM'],
    priceNote: 'Inquire for Weekend Rate'
  },
  {
    id: 'corporate-rate',
    title: 'Corporate & Government Delegate Rate',
    badge: 'Business',
    description: 'Special discounted rates for business executives and delegates visiting Mbeya for conferences, university events, or meetings.',
    perks: ['Discounted Room Rate', 'Free Fast Wi-Fi', 'Express Laundry Service', 'Invoice / EFD Receipt Available'],
    priceNote: 'Special Business Discount'
  },
  {
    id: 'long-stay',
    title: 'Extended Stay Discount (7+ Nights)',
    badge: 'Best Value',
    description: 'Planning a longer visit in Mbeya? Save significantly on stays of 7 consecutive nights or more with complimentary laundry credits.',
    perks: ['Up to 20% Off Room Rate', 'Complimentary Weekly Laundry', 'Daily Room Service', 'Free Airport Shuttle Assistance'],
    priceNote: '7+ Night Discount'
  }
];

export const DEFAULT_GALLERY_IMAGES: GalleryItem[] = [
  { id: '1', title: 'Hotel Grounds & Main Entrance', category: 'Grounds', colorClass: 'ph--forest' },
  { id: '2', title: 'Deluxe Double Bedroom', category: 'Rooms', colorClass: 'ph--brown' },
  { id: '3', title: 'Outdoor Swimming Pool', category: 'Pool', colorClass: 'ph--slate' },
  { id: '4', title: 'Signature Fresh Tilapia Dish', category: 'Dining', colorClass: 'ph--sand' },
  { id: '5', title: 'Fresh Daily Breakfast', category: 'Dining', colorClass: 'ph--sand' },
  { id: '6', title: 'Hotel Restaurant & Lounge', category: 'Dining', colorClass: 'ph--dusk' },
  { id: '7', title: 'Weekend Live Band Stage', category: 'Events', colorClass: 'ph--olive' },
  { id: '8', title: 'Main Conference & Event Hall', category: 'Events', colorClass: 'ph--brown' },
  { id: '9', title: 'Conference Hall Stage & Banquet', category: 'Events', colorClass: 'ph--forest' },
  { id: '10', title: 'Standard Room Setup', category: 'Rooms', colorClass: 'ph--sand' },
  { id: '11', title: 'Guest Suite Setup', category: 'Rooms', colorClass: 'ph--sand' }
];

export const LANDMARKS: LandmarkItem[] = [
  { name: 'Mzumbe University Mbeya Campus', distance: '0.4 km', note: 'Short walking distance' },
  { name: 'Beaco Resort Hotel', distance: '1.1 km', note: '5 mins drive' },
  { name: 'Gr Comfort Hotel', distance: '2.0 km', note: '6 mins drive' },
  { name: 'Mbeya Hotel Limited', distance: '2.0 km', note: '6 mins drive' },
  { name: 'GR City Hotel', distance: '2.6 km', note: '8 mins drive' },
  { name: 'Hotel Desderia', distance: '2.8 km', note: '9 mins drive' },
  { name: 'MDOPE IDDE HOTEL', distance: '3.4 km', note: '10 mins drive' },
  { name: 'Mbeya Regional Hospital', distance: '3.8 km', note: '12 mins drive' }
];

export const DEFAULT_SETTINGS: Record<string, string> = {
  whatsapp_number: '255762555557',
  reception_hours: 'Open 24 hours',
  reply_promise_minutes: '15',
  address: 'Forest Mpya, Mzumbe University area, Mbeya 54113'
};

// Aliases for immediate consumption
export const ROOMS: RoomOption[] = DEFAULT_ROOMS;
export const REVIEWS: ReviewItem[] = DEFAULT_REVIEWS;
export const OFFERS: OfferItem[] = DEFAULT_OFFERS;
export const GALLERY_IMAGES: GalleryItem[] = DEFAULT_GALLERY_IMAGES;

// Supabase Direct Query Functions
export async function fetchRooms(): Promise<RoomOption[]> {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        *,
        room_images (
          id,
          storage_path,
          sort_order,
          is_cover
        )
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('Supabase rooms query error:', error.message);
      return DEFAULT_ROOMS;
    }

    if (!data || data.length === 0) {
      return DEFAULT_ROOMS;
    }

    return data.map((item: any) => {
      const defaultMatch = DEFAULT_ROOMS.find(r => r.slug === item.slug);
      const rawImages = (item.room_images || []).sort(
        (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
      );
      const imageUrls: string[] = rawImages
        .map((img: any) => getRoomImageUrl(img.storage_path))
        .filter((url: string | null): url is string => Boolean(url));

      const finalImages = imageUrls.length > 0 ? imageUrls : (defaultMatch?.images || []);

      return {
        id: item.id,
        slug: item.slug,
        name: item.name,
        category: item.category,
        capacity: item.capacity_label || defaultMatch?.capacity || '2 Guests',
        price: formatRoomPrice(item.price_tzs),
        price_tzs: item.price_tzs,
        units: item.total_units || defaultMatch?.units || 1,
        tags: (Array.isArray(item.tags) && item.tags.length > 0) ? item.tags : (defaultMatch?.tags || []),
        description: item.description || defaultMatch?.description || '',
        colorClass: item.color_class || defaultMatch?.colorClass || 'ph--forest',
        amenities: (Array.isArray(item.amenities) && item.amenities.length > 0) ? item.amenities : (defaultMatch?.amenities || []),
        image: finalImages[0] || undefined,
        images: finalImages
      };
    });
  } catch (err) {
    console.warn('Error fetching rooms from Supabase, using defaults:', err);
    return DEFAULT_ROOMS;
  }
}

export async function fetchReviews(): Promise<ReviewItem[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase reviews query error:', error.message);
      return DEFAULT_REVIEWS;
    }

    if (!data || data.length === 0) {
      return DEFAULT_REVIEWS;
    }

    return data.map((item: any) => ({
      id: item.id,
      name: item.guest_name,
      tripType: item.trip_type || 'Verified Guest',
      rating: item.rating,
      date: item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent Guest',
      comment: item.comment,
      is_published: item.is_published
    }));
  } catch (err) {
    console.warn('Error fetching reviews from Supabase, using defaults:', err);
    return DEFAULT_REVIEWS;
  }
}

export async function fetchOffers(): Promise<OfferItem[]> {
  try {
    const [{ data, error }, { data: settingsData }] = await Promise.all([
      supabase
        .from('offers')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'member_only_offers')
        .maybeSingle()
    ]);

    if (error) {
      console.warn('Supabase offers query error:', error.message);
      return DEFAULT_OFFERS;
    }

    if (!data || data.length === 0) {
      return DEFAULT_OFFERS;
    }

    let memberOnlySet = new Set<string>();
    if (settingsData?.value) {
      try {
        const parsed = JSON.parse(settingsData.value);
        if (Array.isArray(parsed)) {
          memberOnlySet = new Set(parsed);
        }
      } catch {}
    }

    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      badge: item.badge || 'Package',
      description: item.description || '',
      perks: Array.isArray(item.perks) ? item.perks : [],
      priceNote: item.price_note || 'Special Rate',
      members_only: item.members_only !== undefined ? Boolean(item.members_only) : memberOnlySet.has(item.id)
    }));
  } catch (err) {
    console.warn('Error fetching offers from Supabase, using defaults:', err);
    return DEFAULT_OFFERS;
  }
}

export async function fetchGallery(): Promise<GalleryItem[]> {
  try {
    const { data, error } = await supabase
      .from('gallery_items')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('Supabase gallery query error:', error.message);
      return DEFAULT_GALLERY_IMAGES;
    }

    if (!data || data.length === 0) {
      return DEFAULT_GALLERY_IMAGES;
    }

    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      colorClass: item.color_class || 'ph--sand',
      storage_path: item.storage_path,
      image: getGalleryImageUrl(item.storage_path) || undefined
    }));
  } catch (err) {
    console.warn('Error fetching gallery from Supabase, using defaults:', err);
    return DEFAULT_GALLERY_IMAGES;
  }
}

export async function fetchSiteSettings(): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value');

    if (error || !data) {
      return DEFAULT_SETTINGS;
    }

    const settingsMap: Record<string, string> = { ...DEFAULT_SETTINGS };
    data.forEach((row: any) => {
      if (row.key && row.value) {
        settingsMap[row.key] = row.value;
      }
    });
    return settingsMap;
  } catch (err) {
    console.warn('Error fetching site settings from Supabase:', err);
    return DEFAULT_SETTINGS;
  }
}

// Dual-write Supabase Insert Helpers

export interface BookingSubmissionPayload {
  guest_name: string;
  guest_phone: string;
  room_id: string;
  check_in: string;
  check_out: string;
  guest_count_label?: string;
  special_requests?: string;
  member_id?: string | null;
}

export async function submitBooking(payload: BookingSubmissionPayload) {
  try {
    let targetRoomId = payload.room_id;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetRoomId);
    if (!isUuid) {
      const { data: foundRoom } = await supabase
        .from('rooms')
        .select('id')
        .eq('slug', targetRoomId)
        .maybeSingle();
      if (foundRoom?.id) {
        targetRoomId = foundRoom.id;
      } else {
        const { data: anyRoom } = await supabase
          .from('rooms')
          .select('id')
          .limit(1)
          .maybeSingle();
        if (anyRoom?.id) {
          targetRoomId = anyRoom.id;
        }
      }
    }

    let checkIn = payload.check_in;
    let checkOut = payload.check_out;
    if (!checkIn) {
      checkIn = new Date().toISOString().split('T')[0];
    }
    if (!checkOut || checkOut <= checkIn) {
      const inDate = new Date(checkIn);
      inDate.setDate(inDate.getDate() + 1);
      checkOut = inDate.toISOString().split('T')[0];
    }

    const { error } = await supabase
      .from('bookings')
      .insert([
        {
          guest_name: payload.guest_name,
          guest_phone: payload.guest_phone,
          room_id: targetRoomId,
          check_in: checkIn,
          check_out: checkOut,
          guest_count_label: payload.guest_count_label || null,
          special_requests: payload.special_requests || null,
          status: 'pending',
          source: 'website',
          member_id: payload.member_id ?? null
        }
      ]);

    if (error) {
      console.warn('Supabase booking insert notice:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Supabase booking error:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

export interface ContactMessagePayload {
  full_name: string;
  phone: string;
  email?: string;
  message: string;
}

export async function submitContactMessage(payload: ContactMessagePayload) {
  try {
    const { error } = await supabase
      .from('contact_messages')
      .insert([
        {
          full_name: payload.full_name,
          phone: payload.phone,
          email: payload.email || null,
          message: payload.message,
          status: 'new'
        }
      ]);

    if (error) {
      console.warn('Supabase contact message insert notice:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Supabase contact message error:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

export interface EventInquiryPayload {
  full_name: string;
  phone: string;
  event_type?: string;
  guest_count?: string;
  target_date?: string | null;
  notes?: string;
}

export async function submitEventInquiry(payload: EventInquiryPayload) {
  try {
    const { error } = await supabase
      .from('event_inquiries')
      .insert([
        {
          full_name: payload.full_name,
          phone: payload.phone,
          event_type: payload.event_type || 'Conference / Seminar',
          guest_count: payload.guest_count || null,
          target_date: payload.target_date || null,
          notes: payload.notes || null,
          status: 'new'
        }
      ]);

    if (error) {
      console.warn('Supabase event inquiry insert notice:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Supabase event inquiry error:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

export interface ReviewSubmissionPayload {
  guest_name: string;
  trip_type?: string;
  rating: number;
  comment: string;
  member_id?: string | null;
}

export async function submitReview(payload: ReviewSubmissionPayload) {
  try {
    const { error } = await supabase
      .from('reviews')
      .insert([
        {
          guest_name: payload.guest_name,
          trip_type: payload.trip_type || 'Verified Guest',
          rating: payload.rating,
          comment: payload.comment,
          is_published: false, // Moderation gate enforced by RLS policy
          member_id: payload.member_id ?? null
        }
      ]);

    if (error) {
      console.warn('Supabase review insert notice:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Supabase review submission error:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}
