import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { name, maxHeightPx = "500", maxWidthPx = "500" } = req.query

  if (!name || typeof name !== "string") {
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

  try {
    // A API nova suporta skipHttpRedirect, vamos usar para obter a URL real
    const photoUrlResponse = await fetch(
      `https://places.googleapis.com/v1/${name}/media?maxHeightPx=${maxHeightPx}&maxWidthPx=${maxWidthPx}&skipHttpRedirect=true`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
        },
      }
    )

    if (!photoUrlResponse.ok) {
      const errorData = await photoUrlResponse.json()
      console.error("Error fetching photo url:", errorData)
      return res.status(photoUrlResponse.status).json({
        message: "Failed to fetch photo url",
        error: errorData
      })
    }

    const data = await photoUrlResponse.json()

    // Retornamos um redirect 302 para a URL da foto assinada temporária que o Google envia
    if (data.photoUri) {
      return res.redirect(302, data.photoUri)
    }

    res.status(404).json({ message: "Photo URI not found in Google response" })
  } catch (error) {
    console.error("Google Places photo integration error:", error)
    res.status(500).json({
      message: "Internal server error fetching Google Places photo",
    })
  }
}
