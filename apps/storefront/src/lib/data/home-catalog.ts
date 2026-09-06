export const HOME_SHELF_CARD_COUNT = 10

// The Home needs enough candidates for the three shelves, but must not fetch
// the entire catalog and all calculated prices during the first paint.
export const HOME_CATALOG_LIMIT = HOME_SHELF_CARD_COUNT * 6
