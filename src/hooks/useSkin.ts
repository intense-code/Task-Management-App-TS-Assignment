import { useEffect, useState } from "react"

const STORAGE_KEY = "taskAccomplisherSkin"
const DEFAULT_SKIN = "classic"

export type SkinName = "classic" | "sunset" | "mint"

export const useSkin = () => {
  const [skin, setSkin] = useState<SkinName>(DEFAULT_SKIN)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as SkinName | null
    const next = stored || DEFAULT_SKIN
    setSkin(next)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.skin = skin
    localStorage.setItem(STORAGE_KEY, skin)
  }, [skin])

  return { skin, setSkin }
}
