import { Module } from "@medusajs/framework/utils"
import { FriggaOmieProductLinkService } from "./service"

export const FRIGGA_OMIE_PRODUCT_LINK_MODULE = "frigga_omie_product_link"

export default Module(FRIGGA_OMIE_PRODUCT_LINK_MODULE, { service: FriggaOmieProductLinkService })
