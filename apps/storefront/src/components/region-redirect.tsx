import { useCreateCart } from "@/lib/hooks/use-cart"
import { useRegions } from "@/lib/hooks/use-regions"
import { getStoredCart } from "@/lib/utils/cart"
import {
  buildPathWithCountryCode,
  getCountryCodeFromPath,
  getDefaultCountryCode,
  getStoredCountryCode,
  isStoreCountryCode,
  resolveStoreRegion,
  setStoredCountryCode,
} from "@/lib/utils/region"
import { useLocation, useNavigate } from "@tanstack/react-router"
import { lazy, useEffect, useState } from "react"

const NotFound = lazy(() => import("./not-found"))

interface RegionRedirectProps {
  children?: React.ReactNode;
  isChecking404?: boolean;
}

const RegionRedirect = ({
  children,
  isChecking404 = false,
}: RegionRedirectProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: regions = [], isLoading: isLoadingRegions } = useRegions({
    fields: "id, currency_code, *countries",
  })
  const createCartMutation = useCreateCart()
  const [is404, setIs404] = useState(false)

  useEffect(() => {
    if (isLoadingRegions || createCartMutation.isPending) return

    const handleRegionRedirect = async () => {
      try {
        const currentPath = location.pathname
        const urlCountryCode = getCountryCodeFromPath(currentPath)
        let countryCode: string | undefined = urlCountryCode

        if (isStoreCountryCode(countryCode)) {
          const region = resolveStoreRegion(regions, countryCode)

          if (region) {
            setStoredCountryCode(countryCode!)
            const cartId = getStoredCart()

            if (!cartId) {
              await createCartMutation.mutateAsync({ region_id: region.id })
            }

            return
          }
        }

        const storedCountryCode = getStoredCountryCode()
        countryCode = isStoreCountryCode(storedCountryCode)
          ? storedCountryCode
          : getDefaultCountryCode(regions)

        if (countryCode) {
          setStoredCountryCode(countryCode)
          const newPath = buildPathWithCountryCode(currentPath, countryCode)

          const cartId = getStoredCart()

          if (!cartId) {
            const region = resolveStoreRegion(regions, countryCode)
            await createCartMutation.mutateAsync({ region_id: region.id })
          }

          navigate({ to: newPath, replace: true })
        } else {
          setIs404(true)
        }
      } catch (error) {
        console.error("[RegionRedirect] Failed to resolve the Brazil storefront region.", error)
        setIs404(true)
      }
    }

    handleRegionRedirect()
  }, [
    location.pathname,
    location.search,
    navigate,
    regions,
    isLoadingRegions,
    createCartMutation.isPending,
    createCartMutation.mutateAsync,
    createCartMutation,
  ])

  return (
    <>
      {children}
      {is404 && isChecking404 && <NotFound />}
    </>
  )
}

export default RegionRedirect
