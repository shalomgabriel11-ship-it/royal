import { RoomOption, ReviewItem, OfferItem } from './types';

export const WHATSAPP_NUMBER = "255762555557";

export function formatWhatsAppUrl(message: string): string {
  const baseUrl = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${baseUrl}?text=${encodeURIComponent(message)}` : baseUrl;
}

export const ROOMS: RoomOption[] = [
  {
    id: 'deluxe-double',
    name: 'Deluxe Double',
    category: 'Deluxe',
    capacity: '2 Guests',
    price: 'Best Rate Guaranteed',
    tags: ['Free breakfast', 'Pool view', 'Free Parking', 'King Bed'],
    description: 'Spacious and elegant room featuring a plush king-sized bed, high-speed Wi-Fi, desk, air conditioning, and peaceful pool views.',
    colorClass: 'ph--forest',
    amenities: ['King-size Bed', 'Air Conditioning', 'Flat-screen TV', 'Free Breakfast', 'Free Wi-Fi', 'En-suite Shower', 'Work Desk'],
    image: 'https://i.ibb.co/0RQQJ00w/royal-mgwasi-hotel-C8tq-X8msrn-1.jpg',
    images: [
      'https://i.ibb.co/0RQQJ00w/royal-mgwasi-hotel-C8tq-X8msrn-1.jpg',
      'https://i.ibb.co/qMkrDgkD/royal-mgwasi-hotel-C8tq-X8msrn-2.jpg',
      'https://i.ibb.co/vvLZ74ZF/royal-mgwasi-hotel-C8tq-X8msrn-3.jpg'
    ]
  },
  {
    id: 'family-room',
    name: 'Family Room',
    category: 'Family',
    capacity: '3-4 Guests',
    price: 'Great Value for Families',
    tags: ['Free breakfast', 'Parking', 'Laundry service', 'Double Beds'],
    description: 'Generous multi-bed layout designed for families or small groups visiting Mbeya, offering comfortable bedding and extra seating.',
    colorClass: 'ph--brown',
    amenities: ['Two Double Beds', 'Free Breakfast', 'Seating Area', 'Flat-screen TV', 'Free Wi-Fi', 'Laundry Service', 'Spacious Closet'],
    image: 'https://i.ibb.co/yBy6yrDC/royal-mgwasi-hotel-DGcu-Js-JMBj-X-1.jpg',
    images: [
      'https://i.ibb.co/yBy6yrDC/royal-mgwasi-hotel-DGcu-Js-JMBj-X-1.jpg',
      'https://i.ibb.co/xS4SdRHS/royal-mgwasi-hotel-DGcu-Js-JMBj-X-2.jpg',
      'https://i.ibb.co/6cm30sRV/royal-mgwasi-hotel-DGcu-Js-JMBj-X-3.jpg',
      'https://i.ibb.co/jZjhNwzJ/royal-mgwasi-hotel-DGcu-Js-JMBj-X-4.jpg',
      'https://i.ibb.co/pv740Ckz/royal-mgwasi-hotel-DGcu-Js-JMBj-X-5.jpg'
    ]
  },
  {
    id: 'standard-room',
    name: 'Standard Room',
    category: 'Standard',
    capacity: '2 Guests',
    price: 'Ideal Business Choice',
    tags: ['Free breakfast', 'Wi-Fi', 'Laundry service', 'Queen Bed'],
    description: 'Clean, serene, and functional accommodation tailored for solo travelers and business guests seeking restful sleep and quiet work space.',
    colorClass: 'ph--sand',
    amenities: ['Queen-size Bed', 'Free Breakfast', 'Free Wi-Fi', 'Work Desk', 'Hot Shower', '24/7 Room Service'],
    image: 'https://i.ibb.co/zT0V8Gk1/royal-mgwasi-hotel-C8tvr-Ebs-Ij2-1.jpg',
    images: [
      'https://i.ibb.co/zT0V8Gk1/royal-mgwasi-hotel-C8tvr-Ebs-Ij2-1.jpg',
      'https://i.ibb.co/k6VfTh2Q/royal-mgwasi-hotel-C8tvr-Ebs-Ij2-2.jpg',
      'https://i.ibb.co/cX6npLKy/royal-mgwasi-hotel-C8tvr-Ebs-Ij2-3.jpg',
      'https://i.ibb.co/x869CRSd/royal-mgwasi-hotel-C8tvr-Ebs-Ij2-4.jpg'
    ]
  },
  {
    id: 'executive-suite',
    name: 'Executive Suite',
    category: 'Suite',
    capacity: '2 Guests',
    price: 'Luxury Accommodation',
    tags: ['Free breakfast', 'Private Lounge', 'Pool access', 'VIP Services'],
    description: 'Our premier suite equipped with a separate living room, private balcony, luxury bathroom, and VIP welcome refreshments.',
    colorClass: 'ph--dusk',
    amenities: ['King-size Bed', 'Separate Living Room', 'Private Balcony', 'Mini Refrigerator', 'Free Breakfast', 'VIP Welcome Refreshment', 'High-Speed Wi-Fi'],
    image: 'https://i.ibb.co/6cm30sRV/royal-mgwasi-hotel-DGcu-Js-JMBj-X-3.jpg'
  },
  {
    id: 'twin-suite',
    name: 'Twin Suite',
    category: 'Standard',
    capacity: '2 Guests',
    price: 'Twin Comfort',
    tags: ['Free breakfast', 'Twin Beds', 'Free Parking', 'Hot Shower'],
    description: 'Features two separate single beds in a immaculate environment, ideal for colleagues or friends traveling together.',
    colorClass: 'ph--slate',
    amenities: ['Two Twin Beds', 'Free Breakfast', 'Free Wi-Fi', 'Work Desk', 'Hot Shower', 'Daily Housekeeping'],
    image: 'https://i.ibb.co/xS4SdRHS/royal-mgwasi-hotel-DGcu-Js-JMBj-X-2.jpg'
  }
];

export const REVIEWS: ReviewItem[] = [
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

export const OFFERS: OfferItem[] = [
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

export const GALLERY_IMAGES = [
  { id: '1', title: 'Hotel Grounds & Main Entrance', category: 'Grounds', colorClass: 'ph--forest' },
  { id: '2', title: 'Deluxe Double Bedroom', category: 'Rooms', colorClass: 'ph--brown', image: 'https://i.ibb.co/0RQQJ00w/royal-mgwasi-hotel-C8tq-X8msrn-1.jpg' },
  { id: '3', title: 'Outdoor Swimming Pool', category: 'Pool', colorClass: 'ph--slate' },
  { id: '4', title: 'Signature Fresh Tilapia Dish', category: 'Dining', colorClass: 'ph--sand', image: 'https://i.ibb.co/Csw3gnrP/9a7f5ffd9ad17bdccb016bf655dcca0c.jpg' },
  { id: '5', title: 'Fresh Daily Breakfast', category: 'Dining', colorClass: 'ph--sand', image: 'https://i.ibb.co/zhX93XPd/royal-mgwasi-hotel-DG04-ECy-Mad-H.jpg' },
  { id: '6', title: 'Hotel Restaurant & Lounge', category: 'Dining', colorClass: 'ph--dusk', image: 'https://i.ibb.co/d4TMkwDW/royal-mgwasi-hotel-C8ty-Nhr-MRo-W.jpg' },
  { id: '7', title: 'Weekend Live Band Stage', category: 'Events', colorClass: 'ph--olive', image: 'https://i.ibb.co/LXg7MpS7/06a8c9b511fe7a3a2aba57ad1c0d47c5.jpg' },
  { id: '8', title: 'Main Conference & Event Hall', category: 'Events', colorClass: 'ph--brown', image: 'https://i.ibb.co/2YhShZQg/royal-mgwasi-hotel-C-1-XYnk-N-0-F-1.jpg' },
  { id: '9', title: 'Conference Hall Stage & Banquet', category: 'Events', colorClass: 'ph--forest', image: 'https://i.ibb.co/8nRcCvW6/royal-mgwasi-hotel-C-1-XYnk-N-0-F-2.jpg' },
  { id: '10', title: 'Standard Room Setup', category: 'Rooms', colorClass: 'ph--sand', image: 'https://i.ibb.co/zT0V8Gk1/royal-mgwasi-hotel-C8tvr-Ebs-Ij2-1.jpg' },
  { id: '11', title: 'Family Room Setup', category: 'Rooms', colorClass: 'ph--sand', image: 'https://i.ibb.co/yBy6yrDC/royal-mgwasi-hotel-DGcu-Js-JMBj-X-1.jpg' }
];

export const LANDMARKS = [
  { name: 'Mzumbe University Mbeya Campus', distance: '0.4 km', note: 'Short walking distance' },
  { name: 'Beaco Resort Hotel', distance: '1.1 km', note: '5 mins drive' },
  { name: 'Gr Comfort Hotel', distance: '2.0 km', note: '6 mins drive' },
  { name: 'Mbeya Hotel Limited', distance: '2.0 km', note: '6 mins drive' },
  { name: 'GR City Hotel', distance: '2.6 km', note: '8 mins drive' },
  { name: 'Hotel Desderia', distance: '2.8 km', note: '9 mins drive' },
  { name: 'MDOPE IDDE HOTEL', distance: '3.4 km', note: '10 mins drive' },
  { name: 'Mbeya Regional Hospital', distance: '3.8 km', note: '12 mins drive' }
];
