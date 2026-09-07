export const HOME_SHELF_CARD_COUNT = 10

// General candidates are bounded; maintenance uses its own filtered request so
// older maintenance products cannot vanish outside the newest-products window.
// 240 candidates measured under 0.4s against the local Store API and provide
// enough in-stock products for the two general shelves without the old 500
// candidate request or a full backend inventory scan.
export const HOME_CATALOG_LIMIT = HOME_SHELF_CARD_COUNT * 24
export const HOME_MAINTENANCE_CANDIDATE_LIMIT = HOME_SHELF_CARD_COUNT * 6
