const fetch = require('playwright');

(async () => {
    // We would need to set prices or figure out why calculated_price is null
    // Let's first check if ANY variant has a calculated price
    
    const res = await fetch('http://localhost:9000/store/products?region_id=reg_01KYBN0MQXC4K5BWKDAN04693X', {
        headers: { 'x-publishable-api-key': 'pk_1f40fb864c3b636f387432c8788dc4b8de3380f9c9fc497bb12f88cf654a3af8' }
    });
    const data = await res.json();
    
    let variantsWithPrice = 0;
    let totalVariants = 0;
    
    for (const product of data.products || []) {
        for (const variant of product.variants || []) {
            totalVariants++;
            if (variant.calculated_price) {
                variantsWithPrice++;
                console.log(`Variant ${variant.id} has price:`, variant.calculated_price);
            }
        }
    }
    
    console.log(`\nFound ${variantsWithPrice} variants with prices out of ${totalVariants} total variants in this region.`);
})();
