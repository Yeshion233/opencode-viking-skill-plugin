import path from "path"
import os from "os"
import { readFileSync, existsSync } from "fs"

export namespace Config {
  export interface VikingConfig {
    apiUrl: string
    ak: string
    sk: string
    apiKey: string
    cacheDir: string
  }

  export interface VikingFileConfig {
    skill_api_url?: string
    skill_ak?: string
    skill_sk?: string
    skill_api_key?: string
    skill_cache_dir?: string
  }

  function getVikingConfig(): VikingFileConfig | null {
    const configDir = path.join(os.homedir(), ".config", "opencode")
    const configPath = path.join(configDir, "viking.json")

    if (existsSync(configPath)) {
      try {
        const content = readFileSync(configPath, "utf-8")
        return JSON.parse(content) as VikingFileConfig
      } catch (err) {
        console.warn(`[viking-skill-plugin] Failed to parse ${configPath}:`, err)
      }
    }

    return null
  }

  export function getConfig(): VikingConfig | null {
    const vikingConfig = getVikingConfig() || {}

    const apiUrl = process.env.VIKING_SKILL_API_URL || vikingConfig.skill_api_url
    const ak = process.env.VIKING_SKILL_AK || vikingConfig.skill_ak || ""
    const sk = process.env.VIKING_SKILL_SK || vikingConfig.skill_sk || ""
    const apiKey = process.env.VIKING_SKILL_API_KEY || vikingConfig.skill_api_key || ""

    if (!apiUrl || (!apiKey && (!ak || !sk))) {
      console.warn("[viking-skill-plugin] Viking API not configured. Set environment variables (VIKING_SKILL_API_URL, VIKING_SKILL_API_KEY or VIKING_SKILL_AK/VIKING_SKILL_SK) or create viking.json config")
      return null
    }

    const cacheDir = process.env.VIKING_SKILL_CACHE_DIR || vikingConfig.skill_cache_dir || path.join(os.homedir(), ".opencode", "skill")

    return { apiUrl, ak, sk, apiKey, cacheDir }
  }
}
