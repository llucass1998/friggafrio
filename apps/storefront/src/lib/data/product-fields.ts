export const PUBLIC_PRODUCT_CARD_FIELDS =
  "id,title,subtitle,description,handle,thumbnail,*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,*categories,*images,*variants.options"

export const PUBLIC_PRODUCT_DETAIL_FIELDS =
  "id,title,subtitle,description,handle,thumbnail,variants.id,variants.title,variants.sku,variants.barcode,variants.ean,variants.upc,+variants.allow_backorder,+variants.manage_inventory,+variants.inventory_quantity,+variants.calculated_price,*variants.options,*images,*options,*options.values,*collection,*tags"
