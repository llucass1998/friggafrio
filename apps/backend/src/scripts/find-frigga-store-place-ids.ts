import "dotenv/config"

async function findPlaceIds() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    console.error("ERRO: GOOGLE_PLACES_API_KEY não está configurada no backend.")
    process.exit(1)
  }

  const queries = [
    "FriggaFrio Alameda Glete, 663, Campos Elíseos - São Paulo/SP Brasil",
    "FriggaFrio Alameda Glete, 926, Campos Elíseos - São Paulo/SP Brasil"
  ]

  console.log("Iniciando busca pelos Place IDs oficiais...\n")

  for (const query of queries) {
    console.log(`Buscando por: "${query}"`)

    try {
      const response = await fetch(
        `https://places.googleapis.com/v1/places:searchText`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location"
          },
          body: JSON.stringify({
            textQuery: query,
            languageCode: "pt-BR"
          })
        }
      )

      if (!response.ok) {
        console.error(`Falha na API: ${response.status} ${response.statusText}`)
        continue
      }

      const data = await response.json()

      if (!data.places || data.places.length === 0) {
        console.log("  Nenhum resultado exato encontrado.\n")
        continue
      }

      console.log(`  Resultados encontrados: ${data.places.length}`)

      data.places.forEach((place: any, index: number) => {
        console.log(`  [Opção ${index + 1}]`)
        console.log(`  Nome: ${place.displayName?.text}`)
        console.log(`  Endereço: ${place.formattedAddress}`)
        console.log(`  Place ID (Copie isso): ${place.id}`)
        console.log(`  Lat/Lng: ${place.location?.latitude}, ${place.location?.longitude}\n`)
      })

    } catch (err) {
      console.error("  Erro ao conectar com a API:", err)
    }
  }

  console.log("Busca concluída. Adicione os IDs desejados no arquivo store-locations.ts (frontend).")
}

findPlaceIds()
