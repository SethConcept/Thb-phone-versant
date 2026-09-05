// Brand strings ONLY — deliberately its own tiny module.
//
// Client components (the interview desk, the results view) need the brand
// name. Importing it from lib/academy dragged that whole module into the
// browser bundle, which shipped the seller PROPERTY REGISTRY (addresses,
// cities, manufactured/park flags) to the client — the exact facts trainees
// are supposed to discover by looking the address up mid-call. Import brand
// strings from here in anything that runs in the browser.

export const SELLER_BRAND = "Twin Home Buyer";
export const DISPO_BRAND = "Equity Track";
