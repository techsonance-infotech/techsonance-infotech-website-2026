export interface ClientStory {
  id: string;
  projectName: string;
  quote: string;
  clientName: string;
  clientRole: string;
  companyName: string;
  location: string;
  avatarUrl: string;
  isVerified?: boolean;
}

export const clientStories: ClientStory[] = [
  {
    id: "freightflow",
    projectName: "FreightFlow",
    quote:
      "We were managing LR details and expenses across spreadsheets and WhatsApp. The new workflow has made it much easier to track each trip and catch billing issues before they become a problem.",
    clientName: "Ankur Rajput",
    clientRole: "Founder & Managing Director",
    companyName: "Ashutosh RoadLines",
    location: "Surat, Gujarat",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80",
    isVerified: true,
  },
  {
    id: "zion",
    projectName: "Zion",
    quote:
      "The team worked closely with us on the mobile experience and paid attention to the small details in the ticket flow. Communication was straightforward, and we could discuss changes as we tested.",
    clientName: "Anush",
    clientRole: "Founder & CEO",
    companyName: "Vagsync AI (Zion Platform)",
    location: "Bengaluru",
    avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&h=200&q=80",
    isVerified: true,
  },
  {
    id: "masterweg",
    projectName: "MasterWeg",
    quote:
      "We needed a backend that could support several workflows without becoming difficult to maintain. The team took time to understand the requirements and helped us shape a cleaner foundation.",
    clientName: "Sandeep Rudra",
    clientRole: "Founder & Managing Director",
    companyName: "MasterWeg",
    location: "Frankfurt, Germany",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&h=200&q=80",
    isVerified: true,
  },
  {
    id: "syncserve",
    projectName: "SyncServe",
    quote:
      "During rush hours when the internet fluctuates, billing can't stop. The offline mode keeps orders and KOTs printing reliably, and everything syncs automatically as soon as the connection is back.",
    clientName: "Rahul Rajput",
    clientRole: "Founder & Owner",
    companyName: "Tasty Food Center",
    location: "Surat, Gujarat",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80",
    isVerified: true,
  },
  {
    id: "accunest",
    projectName: "Accunest",
    quote:
      "Textile job-work and GST invoices used to require endless manual calculation across registers. Accunest simplified our workflow so our accountants generate compliant e-invoices in minutes without stress.",
    clientName: "Narayan Singh",
    clientRole: "Founder & Managing Director",
    companyName: "Ambika Textiles",
    location: "Surat, Gujarat",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&h=200&q=80",
    isVerified: true,
  },
  {
    id: "marketplace",
    projectName: "TechSonance Marketplace",
    quote:
      "Handling multiple vendors, diverse product catalogs, and automated payout splits seemed overwhelming. The platform handles cart updates smoothly and keeps our merchant onboarding straightforward and simple.",
    clientName: "Ronak Kothari",
    clientRole: "Multi-Brand Merchant Partner",
    companyName: "TechSonance Marketplace Portfolio",
    location: "Ahmedabad, Gujarat",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&h=200&q=80",
    isVerified: true,
  },
];
