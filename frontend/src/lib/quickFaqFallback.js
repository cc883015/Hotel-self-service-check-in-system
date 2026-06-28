/** Client-side fallback when /api/support/quick-questions is empty or unreachable. */
export const QUICK_FAQ_FALLBACK = [
  {
    id: "faq-wifi-ssid-en",
    intent: "wifi_ssid",
    question: "WiFi name",
    answer:
      "Our WiFi networks are **cliffinn**, **cliffinn A Building**, or **cliffinn B Building** — connect to the one for your building.",
    actions: [],
  },
  {
    id: "faq-wifi-pass-en",
    intent: "wifi_password",
    question: "WiFi password",
    answer: "The WiFi password is **cliffinn528** (same for all networks).",
    actions: ["copy_wifi"],
  },
  {
    id: "faq-parking-en",
    intent: "parking",
    question: "Parking",
    answer: "Parking is right behind the building, just behind your room.",
    actions: [],
  },
  {
    id: "faq-checkin-en",
    intent: "checkin_time",
    question: "Check-in time",
    answer: "Check-in time is **2:00 PM**.",
    actions: [],
  },
  {
    id: "faq-checkout-en",
    intent: "checkout_time",
    question: "Check-out time",
    answer: "Check-out time is **10:00 AM**.",
    actions: [],
  },
  {
    id: "faq-extend-en",
    intent: "extend_stay",
    question: "Extend stay",
    answer:
      "To extend your stay, please come to reception **before 10:00 AM** to pay in person, **or** re-book the same room type on the platform where you booked online.",
    actions: [],
  },
  {
    id: "faq-laundry-en",
    intent: "laundry",
    question: "Laundry",
    answer: "See nearby laundromats on Google Maps — WaterSpirit (746 Main St) or Best Soapbox (831 Main St).",
    actions: [],
  },
  {
    id: "faq-dining-en",
    intent: "dining",
    question: "Nearby dining",
    answer: "Nearby on Main St: Pineapple Hotel, McDonald's, KFC.",
    actions: [],
  },
  {
    id: "faq-super-en",
    intent: "supermarket",
    question: "Supermarket",
    answer: "Coles Woolloongabba, Friendly Grocer, or Grab & Go on Main St.",
    actions: [],
  },
  {
    id: "faq-damage-en",
    intent: "damage_report",
    question: "Damage / complaint",
    answer: "For damage, faults, or urgent matters, please **contact reception in person** at the front desk.",
    actions: ["contact_front_desk"],
  },
];
