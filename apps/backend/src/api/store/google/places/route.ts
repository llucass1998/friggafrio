import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { placeId } = req.query

  if (!placeId || typeof placeId !== "string" || !/^[A-Za-z0-9._:-]{1,200}$/.test(placeId)) {
    return res.status(400).json({
      message: "placeId is required",
    })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return res.status(500).json({
      message: "Google Places API Key not configured",
    })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5_000)
  try {
    // 1. Obter os metadados do lugar, pedindo APENAS as fotos (field mask `photos`)
    const detailsResponse = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?fields=photos`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "photos"
        },
        signal: controller.signal,
      }
    )

    if (!detailsResponse.ok) {
      console.warn("Google Places details request failed", { status: detailsResponse.status })
      return res.status(detailsResponse.status).json({
        message: "Failed to fetch place details",
      })
    }

    const detailsData = await detailsResponse.json()
    const photos = detailsData.photos || []

    // 2. Extrair os photoNames para que o frontend consiga exibir as fotos.
    // Usaremos a Places API (New) novamente para buscar a Media URL no front?
    // Não, nós não devemos enviar a chave pro front.
    // O correto é criar um endpoint proxy para as imagens OU retornar o Name
    // e ter um proxy de imagem no backend.

    const photoReferences = photos.map((p: { photo_reference: string, height: number, width: number }) => ({
      // @ts-expect-error
      name: p.name,
      // @ts-expect-error
      widthPx: p.widthPx,
      // @ts-expect-error
      heightPx: p.heightPx,
      // @ts-expect-error
      authorAttributions: p.authorAttributions
    }))

    res.json({
      photos: photoReferences
    })
  } catch (error) {
    console.error("Google Places integration error")
    res.status(500).json({
      message: "Internal server error connecting to Google Places API",
    })
  } finally {
    clearTimeout(timeout)
  }
}
