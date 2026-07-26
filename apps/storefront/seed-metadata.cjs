(async () => {
    // using native fetch
    const res = await fetch('http://localhost:9000/store/products?region_id=reg_01KYBN0MQXC4K5BWKDAN04693X', {
        headers: { 'x-publishable-api-key': 'pk_1f40fb864c3b636f387432c8788dc4b8de3380f9c9fc497bb12f88cf654a3af8' }
    });
    const data = await res.json();
    
    for (let i = 0; i < Math.min(3, data.products.length); i++) {
        console.log(`Product ${data.products[i].id} metadata:`, data.products[i].metadata);
        if (data.products[i].variants && data.products[i].variants.length > 0) {
            console.log(`Variant ${data.products[i].variants[0].id} metadata:`, data.products[i].variants[0].metadata);
        }
    }
})();
