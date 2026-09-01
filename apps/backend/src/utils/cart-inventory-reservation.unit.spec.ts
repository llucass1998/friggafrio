import { buildCartInventoryReservations } from "./cart-inventory-reservation"

describe("cart inventory reservations", () => {
  it("accepts a graph projection with multiple stock locations", () => {
    expect(buildCartInventoryReservations([
      {
        id: "line_1",
        quantity: 1,
        variant: {
          id: "variant_1",
          manage_inventory: true,
          allow_backorder: false,
          inventory_items: [{
            inventory_item_id: "inventory_1",
            required_quantity: 1,
            inventory: {
              location_levels: [{
                location_id: "location_1",
                stocked_quantity: 5,
                reserved_quantity: 0,
                stock_locations: [{
                  id: "location_1",
                  sales_channels: [{ id: "channel_1" }],
                }],
              }],
            },
          }],
        },
      },
    ], "channel_1")).toEqual([{
      line_item_id: "line_1",
      inventory_item_id: "inventory_1",
      location_id: "location_1",
      quantity: 1,
      allow_backorder: false,
    }])
  })
})
