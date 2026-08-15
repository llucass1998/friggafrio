/**
 * Compatibility entrypoint. Inventory projection now always revalidates the
 * live Omie stock source instead of replaying stale catalog metadata.
 */
export { default } from "./reconcile-omie-inventory"
