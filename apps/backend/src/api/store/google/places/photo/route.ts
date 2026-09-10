import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { name, maxHeightPx = "500", maxWidthPx = "500" } = req.query

  if (!name || typeof name !== "string" || !/^places\/[A-Za-z0-9._:-]{1,160}\/photos\/[A-Za-z0-9._:-]{1,160}$/.test(name)) {
    return res.status(400).json({
      message: "Photo name is required",
    })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return res.status(500).json({
      message: "Google Places API Key not configured",
    })
  }

  const height = Number(maxHeightPx)
  const width = Number(maxWidthPx)
  if (!Number.isInteger(height) || !Number.isInteger(width) || height < 64 || height > 1600 || width < 64 || width > 1600) {
    return res.status(400).json({ message: "Photo dimensions are invalid" })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5_000)
  try {
    // A API nova suporta skipHttpRedirect, vamos usar para obter a URL real
    const photoUrlResponse = await fetch(
      `https://places.googleapis.com/v1/${name}/media?maxHeightPx=${height}&maxWidthPx=${width}&skipHttpRedirect=true`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
        },
        signal: controller.signal,
      }
    )

    if (!photoUrlResponse.ok) {
      console.warn("Google Places photo request failed", { status: photoUrlResponse.status })
      return res.status(photoUrlResponse.status).json({
        message: "Failed to fetch photo url",
      })
    }

    const data = await photoUrlResponse.json()

    // Retornamos um redirect 302 para a URL da foto assinada temporária que o Google envia
    if (data.photoUri) {
      return res.redirect(302, data.photoUri)
    }

    res.status(404).json({ message: "Photo URI not found in Google response" })
  } catch (error) {
    console.error("Google Places photo integration error")
    res.status(500).json({
      message: "Internal server error fetching Google Places photo",
    })
  } finally {
    clearTimeout(timeout)
  }
}
