(async () => {
    // Check Brazil region since seed sets BRL
    const res = await fetch('http://localhost:9000/store/products?region_id=reg_01KYC122G9SCKQK6W4919J9QF9', {
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
                console.log(`Variant ${variant.id} has price:`, variant.calculated_price.calculated_amount);
            }
        }
    }
    
    console.log(`\nFound ${variantsWithPrice} variants with prices out of ${totalVariants} total variants in this region.`);
})();
