import {
  LostFoundType,
  LostFoundCategory,
  LostFoundStatus,
  ClaimStatus,
} from "@prisma/client";

export interface DemoLostFoundItem {
  id: string;
  referenceNumber: string;
  reporterId: string;
  reporterName?: string;
  reporterEmail?: string;
  type: LostFoundType;
  title: string;
  description: string;
  category: LostFoundCategory;
  status: LostFoundStatus;
  location: string;
  dateLostFound: string;
  timeLostFound?: string | null;
  imageUrl?: string | null;
  contactPreference: string;
  identifyingDetails?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  resolutionNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DemoLostFoundClaim {
  id: string;
  itemId: string;
  claimantId: string;
  claimantName?: string;
  claimantEmail?: string;
  claimantRoll?: string;
  claimStatement: string;
  verificationAnswers: string;
  status: ClaimStatus;
  submittedAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  reviewerRemarks?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DemoLostFoundAttachment {
  id: string;
  itemId: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export interface DemoLostFoundMatch {
  id: string;
  lostItemId: string;
  foundItemId: string;
  matchScore: number;
  matchingFactors: string[];
  status: "SUGGESTED" | "CONFIRMED" | "DISMISSED";
  createdAt: string;
  reviewedAt?: string | null;
}

const INITIAL_LOST_FOUND_ITEMS: DemoLostFoundItem[] = [
  // 1. RESOLVED case (MacBook Charger)
  {
    id: "lf-item-001",
    referenceNumber: "LF-2026-0001",
    reporterId: "demo-student-001",
    reporterName: "Tirth Patel",
    reporterEmail: "student@campussphere.edu",
    type: LostFoundType.LOST,
    title: "Apple 96W USB-C Power Adapter & Magsafe Cable",
    description: "Left my MacBook white 96W USB-C charger plugged into desk socket 14 near the silent study wing.",
    category: LostFoundCategory.ELECTRONICS,
    status: LostFoundStatus.RESOLVED,
    location: "Central Library 2nd Floor",
    dateLostFound: "2026-09-01",
    timeLostFound: "04:30 PM",
    imageUrl: "https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?w=500&auto=format&fit=crop&q=60",
    contactPreference: "CAMPUS_PORTAL",
    identifyingDetails: "Small green marker dot near the prongs, slight scuff mark on braided cable.",
    resolvedAt: "2026-09-03T11:00:00.000Z",
    resolvedBy: "demo-admin-001",
    resolutionNotes: "Claimant provided matching serial snippet and verified identifying green marker dot. Handover complete.",
    createdAt: "2026-09-01T17:00:00.000Z",
    updatedAt: "2026-09-03T11:00:00.000Z",
  },
  // 2. LOST Blue Hydro Flask (Strong match with found item 014)
  {
    id: "lf-item-002",
    referenceNumber: "LF-2026-0002",
    reporterId: "demo-student-001",
    reporterName: "Tirth Patel",
    reporterEmail: "student@campussphere.edu",
    type: LostFoundType.LOST,
    title: "Blue Hydro Flask Insulated Water Bottle 32oz",
    description: "Pacific blue wide mouth insulated bottle with a black flex cap and college coding sticker.",
    category: LostFoundCategory.WATER_BOTTLE,
    status: LostFoundStatus.PUBLISHED,
    location: "Central Library Reading Hall",
    dateLostFound: "2026-09-12",
    timeLostFound: "02:15 PM",
    imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=60",
    contactPreference: "CAMPUS_PORTAL",
    identifyingDetails: "GitHub Octocat sticker and small dent on bottom rim.",
    createdAt: "2026-09-12T15:00:00.000Z",
    updatedAt: "2026-09-12T15:00:00.000Z",
  },
  // 3. LOST Keys with lanyard
  {
    id: "lf-item-003",
    referenceNumber: "LF-2026-0003",
    reporterId: "demo-student-002",
    reporterName: "Priya Sharma",
    reporterEmail: "priya.sharma@campussphere.edu",
    type: LostFoundType.LOST,
    title: "Set of 3 Keys on Red CampusSphere Lanyard",
    description: "Two brass door keys and one small bike lock key attached to an institutional red lanyard.",
    category: LostFoundCategory.KEYS,
    status: LostFoundStatus.PUBLISHED,
    location: "Student Canteen Outdoor Seating",
    dateLostFound: "2026-09-13",
    timeLostFound: "01:10 PM",
    imageUrl: null,
    contactPreference: "CAMPUS_PORTAL",
    identifyingDetails: "Silver miniature Eiffel Tower keychain attached.",
    createdAt: "2026-09-13T13:30:00.000Z",
    updatedAt: "2026-09-13T13:30:00.000Z",
  },
  // 4. FOUND Leather Wallet with PENDING claim
  {
    id: "lf-item-004",
    referenceNumber: "LF-2026-0004",
    reporterId: "demo-faculty-001",
    reporterName: "Dr. Sarah Jenkins",
    reporterEmail: "faculty@campussphere.edu",
    type: LostFoundType.FOUND,
    title: "Brown Leather Bi-fold Wallet",
    description: "Found a brown leather men's wallet on the bench in the Main Auditorium lobby after the freshman orientation.",
    category: LostFoundCategory.WALLET,
    status: LostFoundStatus.CLAIM_PENDING,
    location: "Main Auditorium Lobby",
    dateLostFound: "2026-09-10",
    timeLostFound: "11:45 AM",
    imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&auto=format&fit=crop&q=60",
    contactPreference: "CAMPUS_PORTAL",
    identifyingDetails: "Contains student metro card, emergency cash, and family photograph in inner sleeve.",
    createdAt: "2026-09-10T12:30:00.000Z",
    updatedAt: "2026-09-11T09:00:00.000Z",
  },
  // 5. LOST Sony Headphones (Strong match with found item 016)
  {
    id: "lf-item-005",
    referenceNumber: "LF-2026-0005",
    reporterId: "demo-student-003",
    reporterName: "Rohan Verma",
    reporterEmail: "rohan.verma@campussphere.edu",
    type: LostFoundType.LOST,
    title: "Sony WH-1000XM4 Noise Canceling Headphones",
    description: "Black over-ear wireless headphones inside their original grey zippered carrying case.",
    category: LostFoundCategory.ELECTRONICS,
    status: LostFoundStatus.PUBLISHED,
    location: "Computer Lab 3 (Turing Lab)",
    dateLostFound: "2026-09-11",
    timeLostFound: "05:45 PM",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
    contactPreference: "CAMPUS_PORTAL",
    identifyingDetails: "Left ear cushion has slight crease. Case contains airline adapter.",
    createdAt: "2026-09-11T18:30:00.000Z",
    updatedAt: "2026-09-11T18:30:00.000Z",
  },
  // 6. FOUND College Identity Card
  {
    id: "lf-item-006",
    referenceNumber: "LF-2026-0006",
    reporterId: "demo-admin-001",
    reporterName: "Campus Administrator",
    reporterEmail: "admin@campussphere.edu",
    type: LostFoundType.FOUND,
    title: "University RFID Student Card (Computer Engg)",
    description: "Found student card handed to Main Gate Security Desk near Turnstile 2.",
    category: LostFoundCategory.STUDENT_CARD,
    status: LostFoundStatus.PUBLISHED,
    location: "Main Gate Security Desk",
    dateLostFound: "2026-09-14",
    timeLostFound: "09:00 AM",
    imageUrl: null,
    contactPreference: "CAMPUS_PORTAL",
    identifyingDetails: "Photo and department visible; card serial number ends with 4821.",
    createdAt: "2026-09-14T09:30:00.000Z",
    updatedAt: "2026-09-14T09:30:00.000Z",
  },
  // 7. LOST Scientific Calculator (Strong match with found item 018)
  {
    id: "lf-item-007",
    referenceNumber: "LF-2026-0007",
    reporterId: "demo-student-004",
    reporterName: "Ananya Gupta",
    reporterEmail: "ananya.gupta@campussphere.edu",
    type: LostFoundType.LOST,
    title: "Casio FX-991EX Classwiz Scientific Calculator",
    description: "Left on desk row 3 during the linear algebra tutorial exam.",
    category: LostFoundCategory.STATIONERY,
    status: LostFoundStatus.PUBLISHED,
    location: "Classroom Block B Room 204",
    dateLostFound: "2026-09-13",
    timeLostFound: "12:30 PM",
    imageUrl: "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=500&auto=format&fit=crop&q=60",
    contactPreference: "CAMPUS_PORTAL",
    identifyingDetails: "Silver sharpie initials 'AG' written inside slide-on cover.",
    createdAt: "2026-09-13T14:00:00.000Z",
    updatedAt: "2026-09-13T14:00:00.000Z",
  },
  // 8. FOUND Smartwatch with REJECTED claim
  {
    id: "lf-item-008",
    referenceNumber: "LF-2026-0008",
    reporterId: "demo-student-001",
    reporterName: "Tirth Patel",
    reporterEmail: "student@campussphere.edu",
    type: LostFoundType.FOUND,
    title: "Fitbit Charge 5 Fitness Tracker (Black)",
    description: "Found on the bench near Court 2 after the inter-department badminton match.",
    category: LostFoundCategory.ELECTRONICS,
    status: LostFoundStatus.PUBLISHED,
    location: "Sports Complex Badminton Hall",
    dateLostFound: "2026-09-08",
    timeLostFound: "06:30 PM",
    imageUrl: "https://images.unsplash.com/photo-1576243345690-4e4b79b63288?w=500&auto=format&fit=crop&q=60",
    contactPreference: "CAMPUS_PORTAL",
    identifyingDetails: "Black silicone band with small scuff on clasp; battery was at 42%.",
    createdAt: "2026-09-08T19:00:00.000Z",
    updatedAt: "2026-09-09T14:00:00.000Z",
  },
  // 9. LOST Blue Denim Jacket
  {
    id: "lf-item-009",
    referenceNumber: "LF-2026-0009",
    reporterId: "demo-student-002",
    reporterName: "Priya Sharma",
    reporterEmail: "priya.sharma@campussphere.edu",
    type: LostFoundType.LOST,
    title: "Levi's Vintage Washed Denim Jacket (Size M)",
    description: "Left on the chair in the ground floor cafeteria during lunch hour.",
    category: LostFoundCategory.CLOTHING,
    status: LostFoundStatus.PUBLISHED,
    location: "Campus Cafeteria",
    dateLostFound: "2026-09-11",
    timeLostFound: "01:45 PM",
    imageUrl: null,
    contactPreference: "CAMPUS_PORTAL",
    identifyingDetails: "Enamel sunflower pin on the right collar lapel.",
    createdAt: "2026-09-11T15:00:00.000Z",
    updatedAt: "2026-09-11T15:00:00.000Z",
  },
  // 10. FOUND Wireless Computer Mouse
  {
    id: "lf-item-010",
    referenceNumber: "LF-2026-0010",
    reporterId: "demo-faculty-001",
    reporterName: "Dr. Sarah Jenkins",
    reporterEmail: "faculty@campussphere.edu",
    type: LostFoundType.FOUND,
    title: "Logitech MX Master 3S Wireless Mouse (Graphite)",
    description: "Found at Workstation 8 in the Machine Learning Research Lab.",
    category: LostFoundCategory.ACCESSORY,
    status: LostFoundStatus.PUBLISHED,
    location: "AI & Data Science Lab",
    dateLostFound: "2026-09-14",
    timeLostFound: "04:00 PM",
    imageUrl: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=60",
    contactPreference: "CAMPUS_PORTAL",
    identifyingDetails: "Custom yellow tape under scroll wheel to reduce glare.",
    createdAt: "2026-09-14T16:30:00.000Z",
    updatedAt: "2026-09-14T16:30:00.000Z",
  },
  // 11. LOST Textbook
  {
    id: "lf-item-011",
    referenceNumber: "LF-2026-0011",
    reporterId: "demo-student-003",
    reporterName: "Rohan Verma",
    reporterEmail: "rohan.verma@campussphere.edu",
    type: LostFoundType.LOST,
    title: "Introduction to Algorithms (CLRS 4th Edition Hardcover)",
    description: "Left inside study cubicle 7 on the 1st floor stack room.",
    category: LostFoundCategory.BOOK,
    status: LostFoundStatus.PUBLISHED,
    location: "Central Library 1st Floor Stacks",
    dateLostFound: "2026-09-12",
    timeLostFound: "07:00 PM",
    imageUrl: null,
    contactPreference: "CAMPUS_PORTAL",
    identifyingDetails: "Yellow sticky notes on Dynamic Programming chapters 14 & 15.",
    createdAt: "2026-09-12T20:00:00.000Z",
    updatedAt: "2026-09-12T20:00:00.000Z",
  },
  // 12. FOUND Ray-Ban Sunglasses with VERIFIED claim
  {
    id: "lf-item-012",
    referenceNumber: "LF-2026-0012",
    reporterId: "demo-student-004",
    reporterName: "Ananya Gupta",
    reporterEmail: "ananya.gupta@campussphere.edu",
    type: LostFoundType.FOUND,
    title: "Black Ray-Ban Wayfarer Polarized Sunglasses",
    description: "Found on the table tennis equipment rack in the hostel recreation center.",
    category: LostFoundCategory.ACCESSORY,
    status: LostFoundStatus.VERIFICATION,
    location: "Hostel 4 Recreation Room",
    dateLostFound: "2026-09-09",
    timeLostFound: "08:15 PM",
    imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&auto=format&fit=crop&q=60",
    contactPreference: "CAMPUS_PORTAL",
    identifyingDetails: "Inside black leather case with cleaning cloth; prescription lens code.",
    createdAt: "2026-09-09T21:00:00.000Z",
    updatedAt: "2026-09-10T15:00:00.000Z",
  },
  // 13. DRAFT report (Student 001's draft)
  {
    id: "lf-item-013",
    referenceNumber: "LF-2026-0013",
    reporterId: "demo-student-001",
    reporterName: "Tirth Patel",
    reporterEmail: "student@campussphere.edu",
    type: LostFoundType.LOST,
    title: "Draft Report: Black Anker USB-C Fast Charger",
    description: "Left in the mechanical workshop drafting bay yesterday evening.",
    category: LostFoundCategory.ELECTRONICS,
    status: LostFoundStatus.DRAFT,
    location: "Mechanical Workshop Bay 3",
    dateLostFound: "2026-09-14",
    timeLostFound: "06:00 PM",
    imageUrl: null,
    contactPreference: "CAMPUS_PORTAL",
    identifyingDetails: "Slight scratch on the front face.",
    createdAt: "2026-09-14T19:00:00.000Z",
    updatedAt: "2026-09-14T19:00:00.000Z",
  },
  // 14. FOUND Blue Bottle (Counterpart to lost item 002)
  {
    id: "lf-item-014",
    referenceNumber: "LF-2026-0014",
    reporterId: "demo-admin-001",
    reporterName: "Campus Administrator",
    reporterEmail: "admin@campussphere.edu",
    type: LostFoundType.FOUND,
    title: "Insulated Metal Water Bottle (Pacific Blue)",
    description: "Found unattended on study table 12 in the Central Library Reading Hall.",
    category: LostFoundCategory.WATER_BOTTLE,
    status: LostFoundStatus.PUBLISHED,
    location: "Central Library Reading Hall",
    dateLostFound: "2026-09-12",
    timeLostFound: "03:00 PM",
    imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=60",
    contactPreference: "CAMPUS_PORTAL",
    identifyingDetails: "Has tech/programming stickers and small dent on base.",
    createdAt: "2026-09-12T16:00:00.000Z",
    updatedAt: "2026-09-12T16:00:00.000Z",
  },
  // 15. LOST Gym Bag
  {
    id: "lf-item-015",
    referenceNumber: "LF-2026-0015",
    reporterId: "demo-student-002",
    reporterName: "Priya Sharma",
    reporterEmail: "priya.sharma@campussphere.edu",
    type: LostFoundType.LOST,
    title: "Nike Black Duffel Gym Bag with Campus Pass",
    description: "Left near locker number 45 in the university gym changing room.",
    category: LostFoundCategory.BAG,
    status: LostFoundStatus.PUBLISHED,
    location: "Sports Complex Gymnasium",
    dateLostFound: "2026-09-13",
    timeLostFound: "07:30 AM",
    imageUrl: null,
    contactPreference: "CAMPUS_PORTAL",
    identifyingDetails: "Contains red microfiber gym towel, skipping rope, and protein shaker.",
    createdAt: "2026-09-13T09:00:00.000Z",
    updatedAt: "2026-09-13T09:00:00.000Z",
  },
  // 16. FOUND Sony Over-Ear Headphones (Counterpart to lost item 005)
  {
    id: "lf-item-016",
    referenceNumber: "LF-2026-0016",
    reporterId: "demo-faculty-001",
    reporterName: "Dr. Sarah Jenkins",
    reporterEmail: "faculty@campussphere.edu",
    type: LostFoundType.FOUND,
    title: "Black Sony Wireless Headphones in Grey Case",
    description: "Found left behind at Desk 14 in the Turing Computer Lab following the evening lab practical.",
    category: LostFoundCategory.ELECTRONICS,
    status: LostFoundStatus.PUBLISHED,
    location: "Computer Lab 3 (Turing Lab)",
    dateLostFound: "2026-09-11",
    timeLostFound: "06:15 PM",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
    contactPreference: "CAMPUS_PORTAL",
    identifyingDetails: "Sony brand, grey zippered hard case with cables inside.",
    createdAt: "2026-09-11T19:00:00.000Z",
    updatedAt: "2026-09-11T19:00:00.000Z",
  },
  // 17. LOST Silver Bracelet
  {
    id: "lf-item-017",
    referenceNumber: "LF-2026-0017",
    reporterId: "demo-student-004",
    reporterName: "Ananya Gupta",
    reporterEmail: "ananya.gupta@campussphere.edu",
    type: LostFoundType.LOST,
    title: "Sterling Silver Chain Bracelet with Small Pearl Charm",
    description: "Slipped off during the cultural fest dance practice in the open amphitheater.",
    category: LostFoundCategory.JEWELLERY,
    status: LostFoundStatus.PUBLISHED,
    location: "Open Air Amphitheater",
    dateLostFound: "2026-09-10",
    timeLostFound: "05:00 PM",
    imageUrl: null,
    contactPreference: "CAMPUS_PORTAL",
    identifyingDetails: "Hallmark 925 stamped near the lobster clasp.",
    createdAt: "2026-09-10T18:00:00.000Z",
    updatedAt: "2026-09-10T18:00:00.000Z",
  },
  // 18. FOUND Casio Calculator (Counterpart to lost item 007)
  {
    id: "lf-item-018",
    referenceNumber: "LF-2026-0018",
    reporterId: "demo-faculty-001",
    reporterName: "Dr. Sarah Jenkins",
    reporterEmail: "faculty@campussphere.edu",
    type: LostFoundType.FOUND,
    title: "Casio Classwiz Calculator (Black & White)",
    description: "Handed over by teaching assistant after mathematics examination in Classroom Block B.",
    category: LostFoundCategory.STATIONERY,
    status: LostFoundStatus.PUBLISHED,
    location: "Classroom Block B Room 204",
    dateLostFound: "2026-09-13",
    timeLostFound: "01:00 PM",
    imageUrl: "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=500&auto=format&fit=crop&q=60",
    contactPreference: "CAMPUS_PORTAL",
    identifyingDetails: "Marked with initials inside battery cover.",
    createdAt: "2026-09-13T14:30:00.000Z",
    updatedAt: "2026-09-13T14:30:00.000Z",
  },
  // 19. LOST Badminton Racket
  {
    id: "lf-item-019",
    referenceNumber: "LF-2026-0019",
    reporterId: "demo-student-001",
    reporterName: "Tirth Patel",
    reporterEmail: "student@campussphere.edu",
    type: LostFoundType.LOST,
    title: "Yonex Astrox 88D Pro Badminton Racket (Red/Blue)",
    description: "Left leaning against bench at Court 1 during the university trials.",
    category: LostFoundCategory.SPORTS,
    status: LostFoundStatus.PUBLISHED,
    location: "Sports Complex Court 1",
    dateLostFound: "2026-09-14",
    timeLostFound: "06:45 PM",
    imageUrl: null,
    contactPreference: "CAMPUS_PORTAL",
    identifyingDetails: "BG80 power strings tensioned at 27 lbs, yellow overgrip with stencil logo.",
    createdAt: "2026-09-14T20:00:00.000Z",
    updatedAt: "2026-09-14T20:00:00.000Z",
  },
  // 20. FOUND USB Flash Drive
  {
    id: "lf-item-020",
    referenceNumber: "LF-2026-0020",
    reporterId: "demo-admin-001",
    reporterName: "Campus Administrator",
    reporterEmail: "admin@campussphere.edu",
    type: LostFoundType.FOUND,
    title: "SanDisk 64GB Dual Drive USB Type-C Flash Drive",
    description: "Left plugged into terminal 12 in the Digital Library section.",
    category: LostFoundCategory.ELECTRONICS,
    status: LostFoundStatus.PUBLISHED,
    location: "Digital Library E-Resource Center",
    dateLostFound: "2026-09-13",
    timeLostFound: "11:00 AM",
    imageUrl: null,
    contactPreference: "CAMPUS_PORTAL",
    identifyingDetails: "Silver metallic casing with small black string lanyard.",
    createdAt: "2026-09-13T11:30:00.000Z",
    updatedAt: "2026-09-13T11:30:00.000Z",
  },
  // 21. LOST Leather Passport Holder & Transit Card
  {
    id: "lf-item-021",
    referenceNumber: "LF-2026-0021",
    reporterId: "demo-student-003",
    reporterName: "Rohan Verma",
    reporterEmail: "rohan.verma@campussphere.edu",
    type: LostFoundType.LOST,
    title: "Black Leather ID & Travel Card Wallet",
    description: "Fell from my pocket during the bus boarding at the South Campus Gate.",
    category: LostFoundCategory.ID_DOCUMENT,
    status: LostFoundStatus.PUBLISHED,
    location: "South Campus Gate Bus Stop",
    dateLostFound: "2026-09-14",
    timeLostFound: "08:15 AM",
    imageUrl: null,
    contactPreference: "CAMPUS_PORTAL",
    identifyingDetails: "Contains international student exchange card with my name.",
    createdAt: "2026-09-14T09:00:00.000Z",
    updatedAt: "2026-09-14T09:00:00.000Z",
  },
  // 22. FOUND Red Umbrella
  {
    id: "lf-item-022",
    referenceNumber: "LF-2026-0022",
    reporterId: "demo-student-002",
    reporterName: "Priya Sharma",
    reporterEmail: "priya.sharma@campussphere.edu",
    type: LostFoundType.FOUND,
    title: "Automatic Folding Red Umbrella with Wooden Handle",
    description: "Found in the umbrella stand at the entrance of the Faculty of Engineering building.",
    category: LostFoundCategory.OTHER,
    status: LostFoundStatus.PUBLISHED,
    location: "Engineering Block A Entrance",
    dateLostFound: "2026-09-12",
    timeLostFound: "05:15 PM",
    imageUrl: null,
    contactPreference: "CAMPUS_PORTAL",
    identifyingDetails: "Dark cherry wood curved handle with brass release button.",
    createdAt: "2026-09-12T17:45:00.000Z",
    updatedAt: "2026-09-12T17:45:00.000Z",
  },
  // 23. LOST Graphing Notebook
  {
    id: "lf-item-023",
    referenceNumber: "LF-2026-0023",
    reporterId: "demo-student-004",
    reporterName: "Ananya Gupta",
    reporterEmail: "ananya.gupta@campussphere.edu",
    type: LostFoundType.LOST,
    title: "Classmate Pulse Grid Notebook (Engineering Mechanics)",
    description: "Contains all course notes and assignment solutions for ME101.",
    category: LostFoundCategory.BOOK,
    status: LostFoundStatus.PUBLISHED,
    location: "Physics Lecture Hall 1",
    dateLostFound: "2026-09-10",
    timeLostFound: "10:30 AM",
    imageUrl: null,
    contactPreference: "CAMPUS_PORTAL",
    identifyingDetails: "Formula reference chart pasted on the inside back cover.",
    createdAt: "2026-09-10T11:00:00.000Z",
    updatedAt: "2026-09-10T11:00:00.000Z",
  },
  // 24. FOUND House Keys
  {
    id: "lf-item-024",
    referenceNumber: "LF-2026-0024",
    reporterId: "demo-admin-001",
    reporterName: "Campus Administrator",
    reporterEmail: "admin@campussphere.edu",
    type: LostFoundType.FOUND,
    title: "Pair of Yale Brass Keys with Blue Carabiner",
    description: "Found on the walkway between the cafeteria and the science block.",
    category: LostFoundCategory.KEYS,
    status: LostFoundStatus.PUBLISHED,
    location: "Central Campus Walkway",
    dateLostFound: "2026-09-14",
    timeLostFound: "01:30 PM",
    imageUrl: null,
    contactPreference: "CAMPUS_PORTAL",
    identifyingDetails: "Carabiner is anodized blue aluminum; two keys with rubber head rings.",
    createdAt: "2026-09-14T14:00:00.000Z",
    updatedAt: "2026-09-14T14:00:00.000Z",
  },
  // 25. LOST Apple Pencil 2nd Generation
  {
    id: "lf-item-025",
    referenceNumber: "LF-2026-0025",
    reporterId: "demo-student-001",
    reporterName: "Tirth Patel",
    reporterEmail: "student@campussphere.edu",
    type: LostFoundType.LOST,
    title: "Apple Pencil (2nd Generation) White Stylus",
    description: "Detached from iPad Pro magnetic edge while packing up in the Design Studio.",
    category: LostFoundCategory.ELECTRONICS,
    status: LostFoundStatus.PUBLISHED,
    location: "Architecture & Design Studio 4",
    dateLostFound: "2026-09-13",
    timeLostFound: "03:45 PM",
    imageUrl: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&auto=format&fit=crop&q=60",
    contactPreference: "CAMPUS_PORTAL",
    identifyingDetails: "Laser engraving near top says 'TP.2024'.",
    createdAt: "2026-09-13T16:00:00.000Z",
    updatedAt: "2026-09-13T16:00:00.000Z",
  },
  // 26. FOUND Smart Ring
  {
    id: "lf-item-026",
    referenceNumber: "LF-2026-0026",
    reporterId: "demo-faculty-001",
    reporterName: "Dr. Sarah Jenkins",
    reporterEmail: "faculty@campussphere.edu",
    type: LostFoundType.FOUND,
    title: "Oura Gen 3 Horizon Smart Health Ring (Stealth Black, Size 10)",
    description: "Found on the lab wash basin ledge in the Bio-Technology building.",
    category: LostFoundCategory.JEWELLERY,
    status: LostFoundStatus.PUBLISHED,
    location: "BioTech Research Wing 2",
    dateLostFound: "2026-09-14",
    timeLostFound: "02:00 PM",
    imageUrl: null,
    contactPreference: "CAMPUS_PORTAL",
    identifyingDetails: "Matte black finish, sensor bumps on inside with size 10 marking.",
    createdAt: "2026-09-14T15:00:00.000Z",
    updatedAt: "2026-09-14T15:00:00.000Z",
  },
];

const INITIAL_LOST_FOUND_CLAIMS: DemoLostFoundClaim[] = [
  // 1. Completed claim for resolved MacBook charger (item 001)
  {
    id: "claim-001",
    itemId: "lf-item-001",
    claimantId: "demo-student-001",
    claimantName: "Tirth Patel",
    claimantEmail: "student@campussphere.edu",
    claimantRoll: "CS-2024-001",
    claimStatement: "This is my 96W MacBook charger that I accidentally left plugged into socket 14.",
    verificationAnswers: "The charger has a distinct green dot I drew near the prongs to identify it, and the serial ends in F52.",
    status: ClaimStatus.COMPLETED,
    submittedAt: "2026-09-02T09:00:00.000Z",
    reviewedAt: "2026-09-03T10:30:00.000Z",
    reviewedBy: "demo-admin-001",
    reviewerRemarks: "Identifying green marker verified by desk staff. Item handed over to student.",
    resolvedAt: "2026-09-03T11:00:00.000Z",
    createdAt: "2026-09-02T09:00:00.000Z",
    updatedAt: "2026-09-03T11:00:00.000Z",
  },
  // 2. Pending claim on found wallet (item 004)
  {
    id: "claim-002",
    itemId: "lf-item-004",
    claimantId: "demo-student-002",
    claimantName: "Priya Sharma",
    claimantEmail: "priya.sharma@campussphere.edu",
    claimantRoll: "CS-2024-042",
    claimStatement: "I lost my brown bi-fold wallet in the auditorium during orientation.",
    verificationAnswers: "Inside there is a metro transit smart card with ID ending 9012, approximately 450 in cash, and a small family picture.",
    status: ClaimStatus.PENDING,
    submittedAt: "2026-09-11T09:00:00.000Z",
    createdAt: "2026-09-11T09:00:00.000Z",
    updatedAt: "2026-09-11T09:00:00.000Z",
  },
  // 3. Rejected claim on smartwatch (item 008)
  {
    id: "claim-003",
    itemId: "lf-item-008",
    claimantId: "demo-student-003",
    claimantName: "Rohan Verma",
    claimantEmail: "rohan.verma@campussphere.edu",
    claimantRoll: "CS-2024-089",
    claimStatement: "I think this is my Apple Watch that fell during the badminton trials.",
    verificationAnswers: "It should be an Apple Watch SE with a magnetic loop band.",
    status: ClaimStatus.REJECTED,
    submittedAt: "2026-09-09T10:00:00.000Z",
    reviewedAt: "2026-09-09T14:00:00.000Z",
    reviewedBy: "demo-admin-001",
    reviewerRemarks: "Item is a Fitbit Charge 5 with silicone strap, not an Apple Watch. Claim rejected.",
    createdAt: "2026-09-09T10:00:00.000Z",
    updatedAt: "2026-09-09T14:00:00.000Z",
  },
  // 4. Verified claim on Ray-Ban sunglasses (item 012)
  {
    id: "claim-004",
    itemId: "lf-item-012",
    claimantId: "demo-student-001",
    claimantName: "Tirth Patel",
    claimantEmail: "student@campussphere.edu",
    claimantRoll: "CS-2024-001",
    claimStatement: "These are my polarized Ray-Bans left in the hostel recreation room.",
    verificationAnswers: "Case is genuine black leather with Ray-Ban gold seal, and inside there is an optical cloth with prescription numbers.",
    status: ClaimStatus.VERIFIED,
    submittedAt: "2026-09-10T10:00:00.000Z",
    reviewedAt: "2026-09-10T15:00:00.000Z",
    reviewedBy: "demo-admin-001",
    reviewerRemarks: "Case details and optical prescription match items held at security office. Verified for handover.",
    createdAt: "2026-09-10T10:00:00.000Z",
    updatedAt: "2026-09-10T15:00:00.000Z",
  },
];

// Active in-memory stores initialized from deterministic seed data
export let DEMO_LOST_FOUND_ITEMS: DemoLostFoundItem[] = JSON.parse(
  JSON.stringify(INITIAL_LOST_FOUND_ITEMS)
);

export let DEMO_LOST_FOUND_CLAIMS: DemoLostFoundClaim[] = JSON.parse(
  JSON.stringify(INITIAL_LOST_FOUND_CLAIMS)
);

export let DEMO_LOST_FOUND_ATTACHMENTS: DemoLostFoundAttachment[] = [];
export let DEMO_LOST_FOUND_MATCHES: DemoLostFoundMatch[] = [];

/**
 * Reset helper for testing and live verification
 */
export function resetDemoLostFoundStore() {
  DEMO_LOST_FOUND_ITEMS = JSON.parse(JSON.stringify(INITIAL_LOST_FOUND_ITEMS));
  DEMO_LOST_FOUND_CLAIMS = JSON.parse(JSON.stringify(INITIAL_LOST_FOUND_CLAIMS));
  DEMO_LOST_FOUND_ATTACHMENTS = [];
  DEMO_LOST_FOUND_MATCHES = [];
}
