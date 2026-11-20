// Where the crawl of the web starts, besides the websites the listings name.
//
// A hub is the public site of a chamber, an association or a regulator that lists its members. The
// crawler reads a hub's front page and up to config.web.hubPages of its own pages whose links say
// they list members, and visits the front page of each site those pages link to. A site found that
// way is kept only if its address ends in .mu or its own page says it is in Mauritius.
//
// Add a hub by adding its front page here. Each one's robots.txt is obeyed like any other site's.
export const HUBS = [
  "https://www.mcci.org/",
  "https://www.businessmauritius.org/",
  "https://www.mexamauritius.org/",
  "https://www.ahrim.mu/",
  "https://www.otam.mu/",
  "https://www.mba.mu/",
  "https://www.stockexchangeofmauritius.com/",
  "https://www.smemu.org/",
  "https://www.edbmauritius.org/",
  "https://www.fscmauritius.org/",
  "https://www.bom.mu/",
  "https://www.tourismauthority.mu/",
  "https://www.mauritiusifc.mu/",
  "https://www.miod.mu/",
  "https://www.mipa.mu/",
  "https://www.mauritiustrade.mu/",
];

/** A link on a hub is followed within the hub when its words or its address say it lists members. */
export const LISTS = /member|membre|directory|annuaire|listed|licensee|licence holders|companies|entreprises|operators|partners|exhibitors|register of|our network|who we represent|issuers/i;
