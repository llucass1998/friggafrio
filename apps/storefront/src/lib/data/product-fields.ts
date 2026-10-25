export const PUBLIC_PRODUCT_CARD_FIELDS =
  "id,title,handle,thumbnail,metadata,variants.id,variants.sku,variants.barcode,variants.ean,variants.upc,*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,collection.id,collection.title,images.url"

// Home shelves only render compact public cards, so avoid transferring unused
// description and option fields during the initial page request.
export const PUBLIC_HOME_PRODUCT_FIELDS =
  "id,title,handle,thumbnail,metadata,variants.sku,*collection,*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,categories.id,categories.handle,images.url"

export const PUBLIC_PRODUCT_DETAIL_FIELDS =
  "id,title,subtitle,description,handle,thumbnail,metadata,*categories,*type,variants.id,variants.title,variants.sku,variants.barcode,variants.ean,variants.upc,+variants.allow_backorder,+variants.manage_inventory,+variants.inventory_quantity,+variants.calculated_price,*variants.options,*images,*options,*options.values,*collection,*tags"
