# Related Products Diversity Audit

Local runtime: `http://127.0.0.1:9000` (Medusa) and `http://127.0.0.1:5173` (Storefront)

The matrix below was generated from one broad Store API candidate retrieval (10 paginated requests of 100 products, no request per card) and the shared deterministic `rankRelatedProducts` scorer. Each source was selected from a different category; the related IDs are stable for the source product ID and exclude the source itself.

| Source product | Category | Related product IDs (ordered) |
| --- | --- | --- |
| `prod_01KZWB54AZ2ZP28RPT7R67D3V1` | `pcat_conexoes` | `prod_01KZWB54B0XAF0HHVPSH8EHDAK`, `prod_01KZWB58GS7BQR656MN8FZ163V`, `prod_01KZWB54B0KPHKP9AJTES02Y1H`, `prod_01KZWB54B01FFWK1G29FSV276W` |
| `prod_01KZWB54AZ5G3MECRZWNSN4SBF` | `pcat_tubos-de-cobre` | `prod_01KZWB588H5VWWZEDT6GFV0PCF`, `prod_01KZWB59QVFC6HZN0VNTG5MBKJ`, `prod_01KZWB58RQ3D1JQH125Y13ZFVJ`, `prod_01KZWB597EA78KSCY24EKAYE11` |
| `prod_01KZWB54AZ5R4KV28YF9T39SRN` | `pcat_outros` | `prod_01KZWB5AE6K5PTSPS2VDNB7SH2`, `prod_01KZWB5AE63N5EA10NP9FJWCJ3`, `prod_01KZWB57ZBGK4AM8J4C5EDHQH5`, `prod_01KZWB59QV80K6NHVGKC0MBEZ8` |
| `prod_01KZWB54AZ9D3XMJ4AX9J3G0DD` | `pcat_gases-refrigerantes` | `prod_01KZWB59QVYZDKMS9XBCK98GAZ`, `prod_01KZWB59QTGNP70SNBZRTXGWTP`, `prod_01KZWB57FBS7QG0D7JE73Z3NDY`, `prod_01KZWB59FR80QS07BRSYR2XJYW` |
| `prod_01KZWB54TV1TDGRC5MR9YXSNQR` | `pcat_manifolds-e-manometros` | `prod_01KZWB59ZGCZ3G8X3AV5APNH20`, `prod_01KZWB56VYYRW0JY1ZH2GGB911`, `prod_01KZWB59QVE87WH78QGAC2Z6B4`, `prod_01KZWB59099E12R9JYABWSCDNE` |
| `prod_01KZWB566KKMAMA8F2C82RWMMN` | `pcat_ferramentas-manuais` | `prod_01KZWB58GSHQF1DKC0XV1ZW2J3`, `prod_01KZWB57FB69B6YGHTTNE36QNV`, `prod_01KZWB57FA61XGDV2YVH5SWM9Y`, `prod_01KZWB5AE6K5PTSPS2VDNB7SH2` |
| `prod_01KZWB566KMKRXQCHZC4WADPW8` | `pcat_componentes` | `prod_01KZWB5A7AEE50DWEAZ4DW70GG`, `prod_01KZWB59ZGFB8YPBVY0900PENS`, `prod_01KZWB5A7AFTM3EERW30EH1B5V`, `prod_01KZWB5AE618EJQWK1DCY5K8TM` |
| `prod_01KZWB56G1913CAQE1WSM3HYA5` | `pcat_oleos` | `prod_01KZWB588JPZWG22QE54HAW1JY`, `prod_01KZWB59QVNS9S23BB8ZFNWR94`, `prod_01KZWB59ZGEWYMEE1HV5PC7CZ0`, `prod_01KZWB59QVP6VV4983NP4WS609` |
| `prod_01KZWB56VYTZRTYTZMD3MJDX0D` | `pcat_compressores` | `prod_01KZWB59QV7KGJCSBJ24G837G5`, `prod_01KZWB59QT561DYTC9TJ7NBFQ7`, `prod_01KZWB59QTF1658MNCBZ2AX2PV`, `prod_01KZWB59ZF72SPHKZ96NX6M987` |
| `prod_01KZWB57PFTF0P2GXHJZ3AJ133` | `pcat_isolamento-termico` | `prod_01KZWB57ZB8NTCWQF92BT332Q7`, `prod_01KZWB57PG1SEAR2FM0VZ9TVZ8`, `prod_01KZWB59QVQ9DW65Z4SA6PN3ER`, `prod_01KZWB59QV7ZJBMV7R0506GVM9` |

Observed result: 10 distinct related sets for 10 source categories; no duplicate IDs within a set; no source product returned in its own set. Products with valid stock/price were preferred. The local catalog currently has no product thumbnails in this projection, so image preference was exercised by unit fixtures and will be used automatically when catalog images are available.
