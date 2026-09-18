import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface MetaConfig {
  title: string;
  description: string;
}

const ROUTE_META: Record<string, MetaConfig> = {
  '/': {
    title: 'ROYAL MGWASI HOTEL | 4-Star Hotel in Forest Mpya, Mbeya',
    description: 'A 4-star hotel in Forest Mpya near Mzumbe University, Mbeya. Free breakfast, outdoor pool, signature tilapia and weekend live band. Book directly on WhatsApp.'
  },
  '/rooms': {
    title: 'Rooms & Suites | ROYAL MGWASI HOTEL, Mbeya',
    description: 'Explore comfortable, clean guest rooms and suites at Royal Mgwasi Hotel in Forest Mpya, Mbeya. Hot showers, free Wi-Fi, and complimentary breakfast.'
  },
  '/dining': {
    title: 'Dining & Live Band | ROYAL MGWASI HOTEL, Mbeya',
    description: 'Enjoy authentic Tanzanian dishes, fresh signature tilapia, halal-friendly dining, and vibrant weekend live music in Mbeya.'
  },
  '/gallery': {
    title: 'Photo & Video Gallery | ROYAL MGWASI HOTEL, Mbeya',
    description: 'Take a visual and video tour of Royal Mgwasi Hotel in Forest Mpya, Mbeya. View our rooms, swimming pool, gardens, and restaurant.'
  },
  '/offers': {
    title: 'Special Offers & Packages | ROYAL MGWASI HOTEL, Mbeya',
    description: 'Exclusive packages, weekend retreats, long-stay discounts, and corporate delegate specials at Royal Mgwasi Hotel Mbeya.'
  },
  '/events': {
    title: 'Events, Conferences & Weddings | ROYAL MGWASI HOTEL, Mbeya',
    description: 'Host your wedding, corporate conference, workshop, or private celebration in our modern hall and lush outdoor gardens in Mbeya.'
  },
  '/our-story': {
    title: 'Our Story & Heritage | ROYAL MGWASI HOTEL, Mbeya',
    description: "Learn about Royal Mgwasi Hotel's dedication to warm Tanzanian hospitality, spotless cleanliness, and community roots in Forest Mpya, Mbeya."
  },
  '/reviews': {
    title: 'Guest Reviews & Ratings | ROYAL MGWASI HOTEL, Mbeya',
    description: 'Read genuine reviews from guests about their stay at Royal Mgwasi Hotel in Mbeya. Rated 4.3 stars on Google.'
  },
  '/contact': {
    title: 'Contact & Location | ROYAL MGWASI HOTEL, Mbeya',
    description: 'Find directions, contact numbers, and travel times to Royal Mgwasi Hotel in Forest Mpya, Mbeya. 15-minute response on WhatsApp.'
  },
  '/book': {
    title: 'Book Your Stay | ROYAL MGWASI HOTEL, Mbeya',
    description: 'Reserve your room at Royal Mgwasi Hotel in Mbeya. Fast confirmation, flexible cancellation, and payment via mobile money or card.'
  },
  '/account': {
    title: 'My Account | ROYAL MGWASI HOTEL',
    description: 'Manage your Royal Mgwasi Hotel member account, reservations, and reviews.'
  },
  '/admin/login': {
    title: 'Staff Login | ROYAL MGWASI HOTEL',
    description: 'Administrative access portal for Royal Mgwasi Hotel staff and management.'
  },
  '/admin': {
    title: 'Admin Dashboard | ROYAL MGWASI HOTEL',
    description: 'Manage hotel bookings, room availability, guest inquiries, and reviews.'
  }
};

export const RouteMetadata = () => {
  const location = useLocation();

  useEffect(() => {
    // Scroll to top on every navigation
    window.scrollTo(0, 0);

    // Look up meta or fallback
    const path = location.pathname.toLowerCase().replace(/\/$/, '') || '/';
    const config = ROUTE_META[path] || {
      title: 'ROYAL MGWASI HOTEL | Forest Mpya, Mbeya',
      description: 'A 4-star hotel in Forest Mpya, Mbeya. Clean rooms, delicious dining, and warm Tanzanian hospitality.'
    };

    // Update document title
    document.title = config.title;

    // Update or insert meta description
    let descMeta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!descMeta) {
      descMeta = document.createElement('meta');
      descMeta.name = 'description';
      document.head.appendChild(descMeta);
    }
    descMeta.content = config.description;

    // Update or insert Open Graph tags
    const updateOrCreateMeta = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    updateOrCreateMeta('og:title', config.title);
    updateOrCreateMeta('og:description', config.description);
    updateOrCreateMeta('og:type', 'website');
    updateOrCreateMeta('og:url', window.location.href);
    updateOrCreateMeta('og:site_name', 'Royal Mgwasi Hotel');

  }, [location.pathname]);

  return null;
};
