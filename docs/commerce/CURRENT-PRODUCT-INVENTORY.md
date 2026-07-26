# Inventário de Produtos Atuais - FriggaFrio

Total de Produtos na Loja (via API): 40

## FORA DO ESCOPO (Ocultar / Desativar compra)
*Todos os 40 produtos originais não batem exatamente com as nomenclaturas estritas exigidas para os gases.*
- prod_01KYBQ9GR742Q9ZMK9EY1KCF8B - Isolamento Elastomérico K-Flex 2m
- prod_01KYBQ9GXEWJ4K3A6545SK83ZZ - Monitor de Tensão Trifásico Full Gauge FaseLog Plus
- prod_01KYBQ9H0R8C40KW2Z4YPKPEDP - Compressor Hermético Embraco 1/3 HP R134a 220V
- prod_01KYBQ9H28T5CCBXZPC5SC46XM - Manifold Analógico Suryha com Mangueiras 90cm
- prod_01KYBQ9H3QZF5XHG70MK42KGXF - Controlador Digital de Temperatura Full Gauge MT-512E 2HP
- prod_01KYBQ9H56TGZ66SX5Y0PHK37Q - Gás Refrigerante R410A Chemours - Botija 11,35kg (Nome errado, Fora do Escopo)
- prod_01KYBQ9H7124VV09WW7SG938DC - Cilindro de Recolhimento Mastercool 13,6kg (30lbs)
- prod_01KYBQ9H8HF05XZ8DGSXZXR49Z - Bomba de Vácuo Suryha 5 CFM Duplo Estágio
- prod_01KYBQ9HAKVXQFABT3BT38VE5S - Limpador Bactericida Metasil Zennith 1L
- prod_01KYBQ9HDB3W9DV6GD14VBKVYJ - Óleo Lubrificante Capella WF 32 Mineral 1L
- prod_01KYBQ9HG5N64MXYCMASR86NGW - Tubo de Cobre Panqueca 1/4" - Rolo com 15m
- prod_01KYBQ9HJQCYE997A76Z18PBQH - Kit Flangeador e Cortador de Tubos Suryha
- prod_01KYBQ9HN8H6B3R69QWVFF5QWY - Quadro de Comando para Câmara Fria 3HP
- prod_01KYBRM2VGRWDRY6179APKY3Y3 - Gás Refrigerante R22 Linde — Botija 13,6 kg (Nome errado)
- prod_01KYBRM30P461K2PEY6DT48DY8 - Gás Refrigerante R404A Forane — Botija 10,9 kg (Nome errado)
- prod_01KYBRM33Z3J63AENT3T2B2RRS - Gás Refrigerante R134A Chemours — Botija 13,6 kg (Nome errado)
- prod_01KYBRM37424EA18FQF905KPW9 - Gás Refrigerante R32 Daikin — Botija 9 kg
- prod_01KYBRM3HPGCD1H3BPQ55HT97D - Compressor Semihermético Bitzer 4NES-14Y — R404A 3 HP 380 V
- prod_01KYBRM3MVJTT9QECRHZ1VNMQD - Compressor Scroll Copeland ZB26KCE-TFD — R404A 7,5 HP 380 V
- prod_01KYBRM3QHP9XWK48WP9BTXRV6 - Unidade Condensadora Elgin 3 HP Trifásica 380 V — R404A
- prod_01KYBRM3TP8SCRQBT40VQ6QYS9 - Painel Frigorífico Polyurethane 100 mm — Módulo 1,20 × 2,40 m
- prod_01KYBRM3XZFCWMDFQB1N7S2K96 - Evaporador Pressostato Dual LP/HP Danfoss KP15 — Câmara Fria
- prod_01KYBRM42Q8FN0YCY7DDQ7FVWT - Válvula de Expansão Termostática Danfoss TGEN 3 — R404A 3/8"
- prod_01KYBRM4D5HDYNNMH90W16CGGK - Válvula Solenoide Castel 1078/6 — 1/2" NC R404A
- prod_01KYBRM4F28ZJ2W6DREM13Y71P - Manifold Digital Testo 550s — Bluetooth com App
- prod_01KYBRM4JZJMBKT4K1QNKB65F6 - Bomba de Vácuo Mastercool 69010 — Duplo Estágio 10 CFM
- prod_01KYBRM4Q5ZVRVNGP3S5QSSVKM - Detector de Vazamento de Gás Refrigerante Infrascan Fieldpiece SRL8
- prod_01KYBRM524M50GB4BMV72WT118 - Óleo Lubrificante Emkarate RL 32 3MAF — Poliol Éster 1 L
- Todos os produtos listados como Bitzer, Mipal, Testo, empilhadeiras.
- Produtos com sufixo duplicados na API (`gas-r410a-chemours-2`, `gas-r410a-chemours-3`).

**O QUE PRECISA SER FEITO:**
1. Rodar script para marcar todos os 40 produtos originais com `purchase_enabled: false` e ocultá-los do storefront.
2. Criar os 5 produtos autorizados (Gás R22 Freon, Gás R134 Freon, Gás R404 Freon, Gás R410 Freon, Gás R22 EOS) com as variantes Botija e Lata e os preços / SKUs definidos.
