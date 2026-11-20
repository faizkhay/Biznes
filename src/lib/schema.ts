// Structured data: what a page says of itself to a machine, built from the same data the page
// shows, so the two cannot disagree. Nothing here is made up for the purpose: a field the data
// does not hold is left out.
import { site } from "@/data/site";
import type { Listing } from "./index";
import { siteUrl } from "./site-url";

/**
 * The schema.org type a directory category maps to, where the tie is honest. A category that
 * mixes kinds ("Police and fire stations", "Other shops") stays a LocalBusiness or a Store.
 */
const TYPES: Record<string, string> = {
  restaurants: "Restaurant",
  "fast-food": "FastFoodRestaurant",
  cafes: "CafeOrCoffeeShop",
  bars: "BarOrPub",
  bakeries: "Bakery",
  supermarkets: "GroceryStore",
  "corner-shops": "ConvenienceStore",
  malls: "ShoppingCenter",
  "drinks-shops": "LiquorStore",
  clothes: "ClothingStore",
  jewellery: "JewelryStore",
  electronics: "ElectronicsStore",
  "sports-outdoor": "SportingGoodsStore",
  pets: "PetStore",
  "other-shops": "Store",
  "gifts-crafts": "Store",
  "books-stationery": "Store",
  "florists-garden": "Store",
  "fresh-food": "Store",
  hotels: "Hotel",
  "guest-houses": "LodgingBusiness",
  pharmacies: "Pharmacy",
  doctors: "MedicalBusiness",
  hospitals: "Hospital",
  dentists: "Dentist",
  opticians: "Optician",
  "health-services": "MedicalBusiness",
  banks: "BankOrCreditUnion",
  atms: "AutomatedTeller",
  "money-exchange": "FinancialService",
  insurance: "InsuranceAgency",
  finance: "FinancialService",
  fuel: "GasStation",
  "car-repair": "AutoRepair",
  "car-parts": "AutoPartsStore",
  "car-dealers": "AutoDealer",
  "car-rental": "AutoRental",
  taxis: "TaxiStand",
  hardware: "HardwareStore",
  furniture: "FurnitureStore",
  "estate-agents": "RealEstateAgent",
  laundry: "DryCleaningOrLaundry",
  hairdressers: "HairSalon",
  "beauty-salons": "BeautySalon",
  fitness: "ExerciseGym",
  schools: "School",
  colleges: "CollegeOrUniversity",
  lawyers: "LegalService",
  "travel-agents": "TravelAgency",
  "event-venues": "EventVenue",
  attractions: "TouristAttraction",
  sports: "SportsActivityLocation",
  casinos: "Casino",
  government: "GovernmentOffice",
  "post-offices": "PostOffice",
  embassies: "Embassy",
  companies: "Organization",
  associations: "Organization",
};

/** The type for a listing of a category. Food outlets are the ones that may carry a menu. */
export const schemaType = (category?: string, fallback = "LocalBusiness") => (category && TYPES[category]) || fallback;
export const servesFood = (category?: string) => ["restaurants", "fast-food", "cafes", "bars", "bakeries"].includes(category ?? "");

/** The path to a page, as a BreadcrumbList. The last step is the page itself. */
export function breadcrumbs(path: { href?: string; label: string }[], here: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: path.map((step, i) => ({ "@type": "ListItem", position: i + 1, name: step.label, item: `${siteUrl}${step.href ?? here}` })),
  };
}

/** A page of listings, as an ItemList of the pages they lead to. */
export function itemList(name: string, listings: Pick<Listing, "name" | "slug">[], href: (l: Pick<Listing, "name" | "slug">) => string = (l) => `/b/${l.slug}`) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: listings.length,
    itemListElement: listings.map((l, i) => ({ "@type": "ListItem", position: i + 1, name: l.name, url: `${siteUrl}${href(l)}` })),
  };
}

/** The site's publisher, as schema.org wants an organisation named. */
export const publisher = () => ({ "@type": "Organization", name: site.builder.legalName, url: site.builder.url });
