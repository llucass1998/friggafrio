import { useState } from "react"
import { StoreLocation } from "../../config/store-locations"
import { Store } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

interface GooglePlacePhotoProps {
  location: StoreLocation
}

type GooglePlacePhotoResponse = {
  photo?: {
    uri: string
    authorAttributions?: {
      displayName: string
      uri?: string
      photoUri?: string
    }[]
  }
}

export function GooglePlacePhoto({ location }: GooglePlacePhotoProps) {
  const [imgError, setImgError] = useState(false)

  // This would fetch from the Medusa backend endpoint once implemented
  // using: GET /store/locations/:locationId/google-place
  const { data: placeData, isLoading, isError } = useQuery<GooglePlacePhotoResponse | null>({
    queryKey: ["store-location", location.id, "google-place-photo"],
    queryFn: async () => {
      // Mocking for now since the backend endpoint isn't fully set up for this schema yet.
      // Returning null means "no photo found" or "Google Places disabled"
      return null
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 1
  })

  // Skeleton Loading
  if (isLoading) {
    return (
      <div className="w-full h-full bg-[#E5EDF4] animate-pulse flex flex-col items-center justify-center">
        <Store className="w-12 h-12 text-[#CBD9E6]" />
        <span className="mt-3 text-sm font-medium text-[#8EA6BC]">Carregando foto da unidade...</span>
      </div>
    )
  }

  // Error fetching from backend
  if (isError || imgError) {
    return (
      <div className="w-full h-full bg-[#E5EDF4] flex flex-col items-center justify-center">
        <Store className="w-12 h-12 text-[#CBD9E6]" />
        <span className="mt-3 text-sm font-medium text-[#8EA6BC]">Foto da unidade indisponível</span>
      </div>
    )
  }

  // Success but no photo available (or not configured)
  if (!placeData || !placeData.photo) {
    return (
      <div className="w-full h-full bg-[#E5EDF4] flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
          <Store className="w-10 h-10 text-[#8EA6BC] opacity-60" />
        </div>
        <span className="text-base font-bold text-[var(--color-navy)] mb-1">Foto da unidade em atualização</span>
        <span className="text-xs text-[#8EA6BC]">Aguardando novas imagens do Google Maps</span>
      </div>
    )
  }

  // Success with photo
  return (
    <>
      <img
        src={placeData.photo.uri}
        alt={`Fachada da ${location.name}`}
        className="w-full h-full object-cover"
        onError={() => setImgError(true)}
      />
      {placeData.photo.authorAttributions?.[0] && (
        <div className="absolute bottom-4 left-4 z-20 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-md text-xs text-white/90">
          Foto: {placeData.photo.authorAttributions[0].uri ? (
            <a 
              href={placeData.photo.authorAttributions[0].uri} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-white hover:underline font-medium"
            >
              {placeData.photo.authorAttributions[0].displayName}
            </a>
          ) : (
            <span className="font-medium">{placeData.photo.authorAttributions[0].displayName}</span>
          )}
        </div>
      )}
    </>
  )
}
