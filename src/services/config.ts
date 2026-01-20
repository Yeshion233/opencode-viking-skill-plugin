import path from "path"
import os from "os"
import { readFileSync, existsSync } from "fs"

export namespace Config {
  export interface VikingConfig {
    apiUrl: string
    ak: string
    sk: string
    cacheDir: string
  }

  export interface OpenCodeConfig {
    viking_skill?: {
      apiUrl?: string
      ak?: string
      sk?: string
      cacheDir?: string
    }
  }

  function getOpenCodeConfig(): OpenCodeConfig | null {
    const configDir = path.join(os.homedir(), ".config", "opencode")
    const candidates = [
      path.join(configDir, "opencode.jsonc"),
      path.join(configDir, "opencode.json"),
    ]

    for (const configPath of candidates) {
      if (existsSync(configPath)) {
        try {
          const content = readFileSync(configPath, "utf-8")
          return JSON.parse(content) as OpenCodeConfig
        } catch (err) {
          console.warn(`[viking-skill-plugin] Failed to parse ${configPath}:`, err)
        }
      }
    }

    return null
  }

  export function getConfig(): VikingConfig | null {
    const openCodeConfig = getOpenCodeConfig()
    const vikingConfig = openCodeConfig?.viking_skill || {}

    const apiUrl = process.env.VIKING_SKILL_API_URL || vikingConfig.apiUrl
    const ak = process.env.VIKING_SKILL_AK || vikingConfig.ak
    const sk = process.env.VIKING_SKILL_SK || vikingConfig.sk

    if (!apiUrl || !ak || !sk) {
      console.warn("[viking-skill-plugin] Viking API not configured. Set environment variables (VIKING_SKILL_API_URL, VIKING_SKILL_AK, VIKING_SKILL_SK) or add viking config to opencode.json")
      return null
    }

    const cacheDir = process.env.VIKING_SKILL_CACHE_DIR || vikingConfig.cacheDir || path.join(os.homedir(), ".opencode", "skill")

    return { apiUrl, ak, sk, cacheDir }
  }
}
