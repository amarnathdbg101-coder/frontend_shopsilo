export interface PolicyItem {
  id: string;
  title: string;
  badge?: string;
  content: string;
}

export interface PolicyCategory {
  id: "privacy" | "terms" | "returns";
  label: string;
  items: PolicyItem[];
}

export const POLICIES: PolicyCategory[] = [
  {
    id: "privacy",
    label: "Privacy Policy",
    items: [
      {
        id: "p1",
        title: "Information We Collect",
        badge: "Data Collection",
        content:
          "We collect essential details including full name, phone number, and location coordinates to display local nearby shops and fulfill in-store counter reservations.",
      },
      {
        id: "p2",
        title: "Merchant & Customer Protection",
        badge: "Zero Ad Sharing",
        content:
          "ShopSilo never sells your personal phone number or browsing habits to third-party advertisers or telemarketers. Customer contact is shared with the local shop exclusively for order pickup coordination and WhatsApp deal updates.",
      },
      {
        id: "p3",
        title: "Location & Device Permissions",
        badge: "GPS Policy",
        content:
          "Location access is strictly used to measure physical walking/driving distance to local neighborhood shops. You can manually set your city without enabling GPS.",
      },
      {
        id: "p4",
        title: "Data Deletion & Grievance Officer",
        badge: "DPDP Act 2023",
        content:
          "In compliance with the Digital Personal Data Protection Act (DPDP), you have the right to request deletion of your account and order history by writing to amarnathdbg101@gmail.com.",
      },
    ],
  },
  {
    id: "terms",
    label: "Terms & Store Rules",
    items: [
      {
        id: "t1",
        title: "Counter Reservations & Hold Time",
        badge: "Merchant Protection",
        content:
          "In-store reservations place a temporary hold on store stock. Shopkeepers reserve the legal right to release unpaid reservations back to store shelves if not collected within 24 hours of confirmation.",
      },
      {
        id: "t2",
        title: "Bargaining & Clerical Errors",
        badge: "Pricing Policy",
        content:
          "Bargained prices agreed in the app require presenting your unique Deal Code at the shop counter. In the rare event of a typographical or catalog pricing error, the merchant reserves the right to correct the price prior to physical billing.",
      },
      {
        id: "t3",
        title: "Direct Counter Transactions",
        badge: "Payment & Tax",
        content:
          "ShopSilo facilitates digital discovery and reservations. Physical billing, Cash on Counter, UPI payments, and GST invoices are directly transacted between customer and merchant.",
      },
      {
        id: "t4",
        title: "Anti-Fraud & Fair Usage",
        badge: "Zero Tolerance",
        content:
          "Fictitious reservations, price harassment, or deliberate no-shows will lead to immediate account suspension and blacklisting across participating neighborhood merchant stores.",
      },
    ],
  },
  {
    id: "returns",
    label: "Returns & Pickups",
    items: [
      {
        id: "r1",
        title: "Counter Inspection Mandate",
        badge: "Verification First",
        content:
          "Customers must inspect item condition, packaging seal, and expiry dates at the counter during pickup before making payment. Once accepted, returns are governed by the merchant's store policy.",
      },
      {
        id: "r2",
        title: "Non-Returnable Goods",
        badge: "Health & Safety",
        content:
          "Perishable groceries, opened cosmetic products, innerwear, and customized items cannot be returned or refunded once taken out of the store premises.",
      },
      {
        id: "r3",
        title: "Warranty & Defect Resolution",
        badge: "Manufacturer Policy",
        content:
          "Electronics, branded appliances, and packaged goods carry authorized manufacturer warranties. Merchants will assist with official brand service center invoices.",
      },
    ],
  },
];
