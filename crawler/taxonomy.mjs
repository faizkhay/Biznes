// What kinds of business and service the index knows, and how the open map's tags fall into them.
//
// A category has a plural label (a page title), a singular (a listing's own line), the map tags
// that put a place in it, and the other words people type for it: English, French and Kreol, as
// said in Mauritius. The words are how a search for "farmasi" or "quincaillerie" finds a pharmacy
// or a hardware shop. They are language, not facts about any business.
//
// A tag is written "key=value". "key=*" catches every value of a key no other category names.

export const GROUPS = [
  { id: "eat", label: "Eat and drink" },
  { id: "shops", label: "Shops" },
  { id: "stay", label: "Places to stay" },
  { id: "health", label: "Health" },
  { id: "money", label: "Money and insurance" },
  { id: "motoring", label: "Cars and transport" },
  { id: "home", label: "Home and building" },
  { id: "beauty", label: "Beauty and wellbeing" },
  { id: "learning", label: "Schools and training" },
  { id: "offices", label: "Offices and professional services" },
  { id: "leisure", label: "Things to do" },
  { id: "public", label: "Public services" },
  { id: "companies", label: "Companies and organisations" },
];

/**
 * [id, group, plural, singular, tags, other words, narrower words]
 *
 * "Other words" mean the whole category: a search for one of them is a search for the category.
 * "Narrower words" name one kind of thing a mixed category may hold ("plumber" among trades). A
 * search for one is never answered with the whole category: it is searched as a word, and the
 * category is only offered as a place to look.
 */
const ROWS = [
  // Eat and drink
  ["restaurants", "eat", "Restaurants", "Restaurant", ["amenity=restaurant", "amenity=food_court"], ["resto", "restoran", "dining", "dinner", "lunch", "eat", "manze", "food"]],
  ["fast-food", "eat", "Snacks and takeaways", "Snack or takeaway", ["amenity=fast_food"], ["snack", "takeaway", "take away", "fast food", "mine", "dholl puri", "roti", "burger", "pizza", "street food"]],
  ["cafes", "eat", "Cafés", "Café", ["amenity=cafe", "amenity=ice_cream", "shop=ice_cream", "shop=coffee"], ["cafe", "coffee", "kafe", "tea room", "salon de thé", "ice cream", "glace"]],
  ["bars", "eat", "Bars and pubs", "Bar", ["amenity=bar", "amenity=pub", "amenity=nightclub"], ["pub", "bar", "nightclub", "club", "boîte", "drinks", "cocktail"]],
  ["bakeries", "eat", "Bakeries and pastry shops", "Bakery", ["shop=bakery", "shop=pastry", "shop=confectionery"], ["boulangerie", "pâtisserie", "patisserie", "gato", "gateaux", "cake", "bread", "dipin", "sweets"]],

  // Shops
  ["supermarkets", "shops", "Supermarkets", "Supermarket", ["shop=supermarket", "shop=department_store", "shop=wholesale"], ["supermarché", "supermarche", "hypermarket", "hypermarché", "grocery", "groceries"]],
  ["corner-shops", "shops", "Corner shops", "Corner shop", ["shop=convenience", "shop=general", "shop=grocery", "shop=kiosk", "shop=tobacco", "shop=variety_store", "shop=food", "shop=deli"], ["tabagie", "boutik", "boutique du coin", "épicerie", "epicerie", "convenience", "minimarket", "superette"]],
  ["markets", "shops", "Markets", "Market", ["amenity=marketplace"], ["bazar", "bazaar", "marché", "marche", "foire", "fair", "market"]],
  ["malls", "shops", "Shopping centres", "Shopping centre", ["shop=mall"], ["mall", "shopping mall", "centre commercial", "galerie", "arcade"]],
  ["fresh-food", "shops", "Butchers, fish and greengrocers", "Fresh food shop", ["shop=butcher", "shop=seafood", "shop=greengrocer", "shop=farm"], ["boucherie", "poissonnerie", "legim", "vegetables", "fruit", "meat", "fish", "poisson", "viande", "légumes", "butcher", "greengrocer", "fishmonger"]],
  ["drinks-shops", "shops", "Wine and spirits shops", "Wine and spirits shop", ["shop=wine", "shop=alcohol", "shop=beverages"], ["wine", "vin", "rhum", "rum", "liquor", "bottle store", "cave"]],
  ["clothes", "shops", "Clothes and shoes", "Clothes shop", ["shop=clothes", "shop=shoes", "shop=boutique", "shop=fashion", "shop=tailor", "shop=fabric", "shop=bag", "shop=fashion_accessories"], ["clothing", "vêtements", "vetements", "linz", "shoes", "chaussures", "soulier", "tailor", "tailleur", "textile", "tissu", "fashion", "prêt à porter", "clothes"]],
  ["jewellery", "shops", "Jewellers and watches", "Jeweller", ["shop=jewelry", "shop=watches"], ["jewelry", "jewellery", "bijouterie", "bijou", "gold", "watch", "montre", "jeweller", "jeweler"]],
  ["electronics", "shops", "Electronics and phones", "Electronics shop", ["shop=electronics", "shop=mobile_phone", "shop=computer", "shop=appliance", "shop=hifi", "shop=video_games", "craft=electronics_repair", "shop=telecommunication"], ["phone", "mobile", "portable", "téléphone", "telephone", "computer", "ordinateur", "laptop", "appliances", "électroménager", "electromenager", "electronics", "phones"], ["repair", "tv"]],
  ["books-stationery", "shops", "Books, stationery and printing", "Bookshop or printer", ["shop=books", "shop=stationery", "shop=copyshop", "shop=newsagent", "craft=printer", "shop=printing"], ["librairie", "bookshop", "papeterie", "stationery", "photocopy", "photocopie", "printing", "imprimerie", "print", "newspaper", "journal"]],
  ["gifts-crafts", "shops", "Gifts, crafts and souvenirs", "Gift or craft shop", ["shop=gift", "shop=craft", "shop=art", "shop=pottery", "craft=handicraft", "craft=pottery", "shop=souvenir", "shop=toys", "shop=model", "shop=music", "shop=musical_instrument"], ["souvenir", "cadeau", "handicraft", "artisanat", "craft", "toys", "jouets", "art"]],
  ["sports-outdoor", "shops", "Sports and outdoor shops", "Sports shop", ["shop=sports", "shop=bicycle", "shop=fishing", "shop=scuba_diving", "shop=outdoor", "shop=boat", "shop=swimming_pool"], ["sport", "bicycle", "vélo", "velo", "bike", "fishing", "pêche", "diving gear", "kayak"]],
  ["florists-garden", "shops", "Florists and garden centres", "Florist or garden centre", ["shop=florist", "shop=garden_centre", "shop=agrarian"], ["fleuriste", "flowers", "fleurs", "plants", "plantes", "nursery", "pépinière", "garden", "jardin", "fertiliser", "florist", "garden centre"]],
  ["pets", "shops", "Pet shops and vets", "Pet shop or vet", ["shop=pet", "amenity=veterinary", "shop=pet_grooming"], ["vet", "vétérinaire", "veterinaire", "animal", "dog", "cat", "aquarium"]],
  ["other-shops", "shops", "Other shops", "Shop", ["shop=*"], [], ["shop", "magasin", "boutik", "store"]],

  // Places to stay
  ["hotels", "stay", "Hotels and resorts", "Hotel", ["tourism=hotel", "leisure=resort", "leisure=beach_resort", "tourism=motel"], ["hôtel", "hotel", "resort", "lotel", "spa hotel", "all inclusive"]],
  ["guest-houses", "stay", "Guest houses and holiday rentals", "Guest house or rental", ["tourism=guest_house", "tourism=apartment", "tourism=chalet", "tourism=hostel", "tourism=camp_site"], ["guesthouse", "guest house", "pension", "campement", "bungalow", "villa", "apartment", "appartement", "studio", "b&b", "bed and breakfast", "chambre d'hôte", "hostel", "airbnb", "holiday rental", "location saisonnière"]],

  // Health
  ["pharmacies", "health", "Pharmacies", "Pharmacy", ["amenity=pharmacy", "healthcare=pharmacy", "shop=chemist", "shop=medical_supply"], ["pharmacie", "farmasi", "chemist", "drugstore", "medicine", "médicament", "medicament"]],
  ["doctors", "health", "Doctors and clinics", "Doctor or clinic", ["amenity=doctors", "amenity=clinic", "healthcare=doctor", "healthcare=clinic", "healthcare=centre", "office=medical", "healthcare=yes"], ["doctor", "docteur", "dokter", "médecin", "medecin", "gp", "clinic", "clinique", "cabinet médical", "dispensary", "dispensaire", "health centre"]],
  ["hospitals", "health", "Hospitals", "Hospital", ["amenity=hospital", "healthcare=hospital"], ["hôpital", "hopital", "lopital", "emergency", "urgence", "casualty"]],
  ["dentists", "health", "Dentists", "Dentist", ["amenity=dentist", "healthcare=dentist"], ["dentiste", "dental", "dantis", "teeth", "orthodontist"]],
  ["opticians", "health", "Opticians", "Optician", ["shop=optician", "healthcare=optometrist"], ["opticien", "glasses", "lunettes", "linet", "eye test", "lenses"]],
  ["health-services", "health", "Laboratories and other health services", "Health service", ["healthcare=*", "amenity=social_facility", "amenity=nursing_home"], ["laboratory", "laboratoire", "lab"], ["blood test", "analyse", "physio", "physiotherapy", "kiné", "therapy", "care home", "counselling"]],

  // Money and insurance
  ["banks", "money", "Banks", "Bank", ["amenity=bank"], ["banque", "labank", "branch", "agence", "loan", "prêt"]],
  ["atms", "money", "Cash machines", "Cash machine", ["amenity=atm"], ["atm", "cash", "distributeur", "guichet automatique", "cashpoint"]],
  ["money-exchange", "money", "Money changers and transfers", "Money changer", ["amenity=bureau_de_change", "amenity=money_transfer", "shop=money_lender"], ["bureau de change", "forex", "exchange", "currency", "devise", "money transfer", "western union", "moneygram"]],
  ["insurance", "money", "Insurance", "Insurer", ["office=insurance"], ["assurance", "lasirans", "insurer", "cover", "policy", "motor insurance"]],
  ["finance", "money", "Financial services", "Financial firm", ["office=financial", "office=financial_advisor", "office=accountant", "office=tax_advisor"], ["financial services", "finance"], ["accountant", "comptable", "audit", "auditor", "bookkeeping", "tax", "investment", "wealth", "leasing", "management company", "fund"]],

  // Cars and transport
  ["fuel", "motoring", "Filling stations", "Filling station", ["amenity=fuel"], ["petrol", "essence", "lesans", "diesel", "gas station", "station service", "filling station", "fuel"]],
  ["car-repair", "motoring", "Garages and tyres", "Garage", ["shop=car_repair", "shop=tyres", "shop=motorcycle_repair", "amenity=car_wash", "craft=car_repair"], ["garage", "garaz", "mechanic", "mécanicien", "mekanik", "tyre", "tire", "pneu", "servicing", "car wash", "lavage", "panel beater", "tôlerie", "tolerie"]],
  ["car-parts", "motoring", "Car parts", "Car parts shop", ["shop=car_parts"], ["spare parts", "pièces détachées", "pieces", "auto parts", "battery", "batterie"]],
  ["car-dealers", "motoring", "Car and motorcycle dealers", "Vehicle dealer", ["shop=car", "shop=motorcycle", "shop=caravan", "shop=truck"], ["showroom", "dealer", "concessionnaire", "second hand cars", "voiture", "motorbike", "moto", "scooter"]],
  ["car-rental", "motoring", "Car and scooter hire", "Car hire", ["amenity=car_rental", "amenity=boat_rental", "amenity=bicycle_rental", "amenity=motorcycle_rental", "shop=rental"], ["car rental", "car hire", "rent a car", "location de voiture", "location voiture", "scooter rental", "bike rental"]],
  ["taxis", "motoring", "Taxis", "Taxi", ["amenity=taxi"], ["taxi", "cab", "airport transfer"]],
  ["driving-schools", "motoring", "Driving schools", "Driving school", ["amenity=driving_school"], ["auto école", "auto ecole", "driving lessons", "learner", "permis"]],

  // Home and building
  ["hardware", "home", "Hardware and building materials", "Hardware shop", ["shop=hardware", "shop=doityourself", "shop=building_materials", "shop=trade", "shop=paint", "shop=electrical", "shop=tiles", "shop=glaziery", "shop=bathroom_furnishing", "shop=lighting", "shop=tool_hire"], ["quincaillerie", "kinkayri", "diy", "bricolage", "building materials", "matériaux", "materiaux", "cement", "ciment", "paint", "peinture", "tiles", "carrelage", "plumbing", "plomberie", "electrical", "tools", "outils", "hardware"]],
  ["furniture", "home", "Furniture and home shops", "Furniture shop", ["shop=furniture", "shop=houseware", "shop=interior_decoration", "shop=bed", "shop=curtain", "shop=kitchen", "shop=household", "shop=carpet", "shop=household_linen", "shop=antiques"], ["meuble", "meubles", "furniture", "sofa", "mattress", "matelas", "curtains", "rideaux", "kitchen", "cuisine", "decoration", "déco", "homeware"]],
  ["trades", "home", "Trades and workshops", "Trade or workshop", ["craft=*"], ["workshop", "atelier", "trades"], ["carpenter", "menuisier", "menuiserie", "welder", "soudeur", "metal work", "plumber", "plombier", "electrician", "électricien", "builder", "contractor", "maçon", "macon", "aluminium", "joinery"]],
  ["estate-agents", "home", "Estate agents", "Estate agent", ["office=estate_agent", "office=property_management"], ["agence immobilière", "immobilier", "real estate", "property", "land for sale", "terrain", "rent", "location", "lease"]],
  ["laundry", "home", "Laundries and dry cleaners", "Laundry", ["shop=laundry", "shop=dry_cleaning"], ["laundry", "pressing", "blanchisserie", "dry cleaning", "nettoyage à sec", "laverie"]],

  // Beauty and wellbeing
  ["hairdressers", "beauty", "Hairdressers and barbers", "Hairdresser", ["shop=hairdresser"], ["coiffeur", "coiffure", "barber", "barbier", "salon", "haircut", "kwafer"]],
  ["beauty-salons", "beauty", "Beauty salons and spas", "Beauty salon", ["shop=beauty", "shop=massage", "shop=cosmetics", "shop=perfumery", "shop=tattoo", "leisure=spa", "amenity=spa"], ["beauté", "beaute", "esthétique", "esthetique", "nails", "manucure", "spa", "massage", "makeup", "cosmetics", "parfum", "perfume", "tattoo", "wax"]],
  ["fitness", "beauty", "Gyms and fitness", "Gym", ["leisure=fitness_centre", "leisure=dance", "amenity=dojo", "leisure=yoga"], ["gym", "fitness", "salle de sport", "yoga", "pilates", "crossfit", "dance", "danse", "martial arts", "karate"]],

  // Schools and training
  ["schools", "learning", "Schools", "School", ["amenity=school", "amenity=kindergarten", "amenity=childcare"], ["école", "ecole", "lekol", "primary", "secondary", "pre-primary", "maternelle", "kindergarten", "nursery", "crèche", "creche", "garderie", "daycare"]],
  ["colleges", "learning", "Colleges and universities", "College or university", ["amenity=college", "amenity=university", "office=educational_institution", "amenity=research_institute", "office=research"], ["collège", "college", "université", "universite", "university", "campus", "tertiary", "polytechnic", "institute", "degree"]],
  ["training", "learning", "Training and language schools", "Training centre", ["amenity=language_school", "amenity=music_school", "amenity=training", "amenity=prep_school", "office=tutoring"], ["training", "formation", "course", "cours", "tuition", "leson", "language", "langue", "music lessons", "coaching"]],

  // Offices and professional services
  ["lawyers", "offices", "Lawyers and notaries", "Law practice", ["office=lawyer", "office=notary"], ["avocat", "avoué", "avoue", "notaire", "barrister", "attorney", "solicitor", "legal", "law firm", "chambers", "lawyer", "notary", "law"]],
  ["it-telecom", "offices", "IT, telecoms and media", "IT or media firm", ["office=it", "office=telecommunication", "office=newspaper", "office=advertising_agency", "amenity=studio", "office=graphic_design", "amenity=internet_cafe", "office=coworking"], ["telecom", "telecoms", "media"], ["software", "web", "website", "digital", "agency", "agence", "marketing", "advertising", "publicité", "publicite", "internet", "radio", "press", "coworking", "data"]],
  ["architects-engineers", "offices", "Architects, engineers and surveyors", "Architect or engineer", ["office=architect", "office=engineer", "office=surveyor", "office=construction_company"], ["architecte", "architect", "engineer", "ingénieur", "ingenieur", "surveyor", "arpenteur", "quantity surveyor", "construction"]],
  ["travel-agents", "offices", "Travel agents and tour operators", "Travel agent", ["shop=travel_agency", "office=travel_agent", "office=guide", "shop=ticket", "office=tour_operator"], ["agence de voyage", "voyage", "travel", "tickets", "billet", "flights", "tour operator", "excursion", "catamaran", "guide"]],
  ["logistics", "offices", "Couriers, freight and storage", "Courier or freight firm", ["office=logistics", "amenity=post_depot", "office=courier", "shop=storage_rental", "office=moving_company", "office=forwarding_agent"], ["courier", "coursier", "freight", "fret"], ["shipping", "clearing", "customs broker", "transitaire", "delivery", "livraison", "storage", "warehouse", "entrepôt", "movers", "déménagement"]],
  ["event-venues", "offices", "Event and conference venues", "Venue", ["amenity=events_venue", "amenity=conference_centre", "amenity=exhibition_centre"], ["wedding hall", "salle de mariage", "lasal", "reception", "conference", "banquet", "function", "event"]],
  ["funeral", "offices", "Funeral services", "Funeral service", ["shop=funeral_directors"], ["funeral", "pompes funèbres", "undertaker"]],
  ["security-firms", "offices", "Security firms", "Security firm", ["office=security"], ["security", "sécurité", "securite", "guard", "gardiennage", "alarm", "cctv"]],
  ["associations", "offices", "Associations and NGOs", "Association", ["office=association", "office=ngo", "office=foundation", "office=charity", "office=union", "office=political_party"], ["ngo", "ong", "association", "charity", "foundation", "fondation", "trade union", "syndicat"], ["club"]],
  ["other-offices", "offices", "Other offices", "Office", ["office=company", "office=yes", "office=consulting", "office=employment_agency", "office=*"], ["office", "bureau", "head office", "siège"], ["company", "compagnie", "société", "societe", "consulting", "consultant", "recruitment", "recrutement"]],

  // Things to do
  ["attractions", "leisure", "Attractions and museums", "Attraction", ["tourism=attraction", "tourism=museum", "tourism=theme_park", "tourism=zoo", "tourism=aquarium", "tourism=gallery", "amenity=arts_centre", "amenity=theatre", "amenity=cinema"], ["museum", "musée", "musee", "park", "zoo", "aquarium", "gallery", "galerie", "theatre", "théâtre", "cinema", "cinéma", "sightseeing", "visit", "things to do", "attraction"]],
  ["sports", "leisure", "Sports and outdoor activities", "Sports venue", ["leisure=sports_centre", "leisure=golf_course", "amenity=dive_centre", "leisure=horse_riding", "leisure=marina", "leisure=stadium", "leisure=sports_hall", "leisure=water_park", "leisure=bowling_alley", "leisure=miniature_golf", "leisure=ice_rink"], ["golf", "diving", "plongée", "plongee", "scuba", "horse riding", "équitation", "marina", "stadium", "stade", "tennis", "football", "swimming", "kitesurf", "surf", "bowling"]],
  ["casinos", "leisure", "Casinos and gaming", "Casino or gaming house", ["amenity=casino", "shop=bookmaker", "shop=lottery", "leisure=adult_gaming_centre", "amenity=gambling"], ["casino", "betting", "pari", "bookmaker", "loto", "lottery", "gaming"]],

  // Public services
  ["government", "public", "Government offices", "Government office", ["office=government", "amenity=townhall", "amenity=courthouse", "office=administrative", "amenity=public_building"], ["ministry", "ministère", "ministere", "council", "conseil", "municipality", "mairie", "district council", "court", "tribunal", "registrar", "civil status", "état civil"]],
  ["police-fire", "public", "Police and fire stations", "Police or fire station", ["amenity=police", "amenity=fire_station"], ["police", "lapolis", "station", "poste de police", "fire", "pompiers", "ponpie"]],
  ["post-offices", "public", "Post offices", "Post office", ["amenity=post_office"], ["poste", "lapos", "mauritius post", "parcel", "colis", "mail", "stamp"]],
  ["embassies", "public", "Embassies and consulates", "Embassy or consulate", ["office=diplomatic", "amenity=embassy"], ["embassy", "ambassade", "consulate", "consulat", "high commission", "visa"]],
  ["community", "public", "Community and social centres", "Community centre", ["amenity=community_centre", "amenity=social_centre", "amenity=library"], ["community centre", "centre social", "village hall", "library", "bibliothèque", "bibliotheque", "youth centre"]],
];

export const CATEGORIES = ROWS.map(([id, group, label, one, tags, words, hints = []]) => ({ id, group, label, one, tags, words, hints }));

// Organisations that come from Wikidata and have no place on the map.
CATEGORIES.push({ id: "companies", group: "companies", label: "Companies and organisations", one: "Company or organisation", tags: [], hints: [], words: ["company", "compagnie", "group", "groupe", "holding", "plc", "ltd", "ltée", "corporation", "listed", "conglomerate"] });

/** Things on the map that are not a business or a service anyone looks up here. */
export const SKIP = new Set([
  "amenity=place_of_worship", "amenity=parking", "amenity=parking_space", "amenity=parking_entrance", "amenity=bench", "amenity=toilets",
  "amenity=shelter", "amenity=bus_station", "amenity=prison", "amenity=telephone", "amenity=drinking_water", "amenity=watering_place",
  "amenity=water_point", "amenity=fountain", "amenity=waste_disposal", "amenity=waste_basket", "amenity=recycling", "amenity=grave_yard",
  "amenity=crematorium", "amenity=ferry_terminal", "amenity=charging_station", "amenity=vending_machine", "amenity=post_box",
  "amenity=bicycle_parking", "amenity=motorcycle_parking", "amenity=clock", "amenity=hunting_stand", "amenity=public_bath",
  "tourism=information", "tourism=viewpoint", "tourism=artwork", "tourism=picnic_site", "tourism=camp_pitch", "tourism=yes",
  "leisure=pitch", "leisure=park", "leisure=playground", "leisure=garden", "leisure=swimming_pool", "leisure=nature_reserve",
  "leisure=common", "leisure=slipway", "leisure=track", "leisure=picnic_table", "leisure=firepit", "leisure=bird_hide", "leisure=fishing",
  "leisure=beach", "leisure=outdoor_seating", "shop=vacant", "shop=no", "office=religion", "office=vacant",
]);

const exact = new Map();
const wild = new Map();
for (const c of CATEGORIES) {
  for (const tag of c.tags) {
    const [key, value] = tag.split("=");
    if (value === "*") wild.set(key, c.id);
    else exact.set(tag, c.id);
  }
}

/** The keys that make a place a business or a service, in the order they are tried. */
export const KEYS = ["shop", "amenity", "office", "tourism", "craft", "healthcare", "leisure"];

/**
 * The category a place's tags put it in, and the tag that decided it. Null when the place is not
 * something this index lists.
 */
export function categorise(tags) {
  let fallback = null;
  for (const key of KEYS) {
    const value = tags[key];
    if (!value || value === "no") continue;
    const tag = `${key}=${value}`;
    if (SKIP.has(tag)) continue;
    if (exact.has(tag)) return { cat: exact.get(tag), tag };
    if (!fallback && wild.has(key)) fallback = { cat: wild.get(key), tag };
  }
  return fallback;
}
