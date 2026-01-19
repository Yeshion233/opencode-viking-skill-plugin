import path from "path"
import os from "os"

export namespace Config {
  export interface VikingConfig {
    apiUrl: string
    ak: string
    sk: string
    cacheDir: string
  }

  export function getConfig(): VikingConfig | null {
    const apiUrl = process.env.VIKING_SKILL_API_URL
    const ak = process.env.VIKING_SKILL_AK
    const sk = process.env.VIKING_SKILL_SK

    if (!apiUrl || !ak || !sk) {
      console.warn("[viking-skill-plugin] Viking API not configured, set VIKING_SKILL_API_URL, VIKING_SKILL_AK, and VIKING_SKILL_SK environment variables")
      return null
    }

    const cacheDir = process.env.VIKING_SKILL_CACHE_DIR || path.join(os.homedir(), ".opencode", "skill")

    return { apiUrl, ak, sk, cacheDir }
  }
}
