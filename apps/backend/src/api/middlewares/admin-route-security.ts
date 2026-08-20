export const ADMIN_API_MATCHER = /^\/admin(?:\/|$)/;

export const isAdminApiPath = (path: string): boolean => ADMIN_API_MATCHER.test(path);
