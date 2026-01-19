import { VikingApiClient } from "./viking-api"
import { Config } from "./config"
import path from "path"
import fs from "fs/promises"
import { createWriteStream } from "fs"
import { pipeline } from "stream/promises"
import { Readable } from "stream"
import os from "os"

export interface SkillInfo {
  id: string
  name: string
  description: string
  source: string
  skillId: string
  latestVersion: string
  updateTime: number
}

export interface CachedSkill {
  skillId: string
  version: string
  path: string
  updateTime: number
}

export class SkillManager {
  private skills: Map<string, SkillInfo> = new Map()
  private skillContentCache: Map<string, string> = new Map()
  private cachedSkills: Map<string, CachedSkill> = new Map()
  private log = {
    info: (message: string, data?: any) => console.log(`[skill-manager] ${message}`, data || ''),
    warn: (message: string, data?: any) => console.warn(`[skill-manager] ${message}`, data || ''),
    error: (message: string, data?: any) => console.error(`[skill-manager] ${message}`, data || ''),
    debug: (message: string, data?: any) => console.debug(`[skill-manager] ${message}`, data || ''),
  }

  constructor(private config: Config.VikingConfig) {}

  async initialize(): Promise<void> {
    await this.ensureCacheDir()
    await this.loadCachedSkills()
    await this.loadSkills()
  }

  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.config.cacheDir, { recursive: true })
      this.log.debug("Cache directory ensured", { path: this.config.cacheDir })
    } catch (error) {
      this.log.error("Failed to create cache directory", { path: this.config.cacheDir, error })
      throw error
    }
  }

  private async loadCachedSkills(): Promise<void> {
    try {
      const entries = await fs.readdir(this.config.cacheDir, { withFileTypes: true })
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skillId = entry.name
          const skillDir = path.join(this.config.cacheDir, skillId)
          
          try {
            const versions = await fs.readdir(skillDir)
            
            for (const version of versions) {
              const versionDir = path.join(skillDir, version)
              const stat = await fs.stat(versionDir)
              
              if (stat.isDirectory()) {
                const cachedSkill: CachedSkill = {
                  skillId,
                  version,
                  path: versionDir,
                  updateTime: stat.mtimeMs,
                }
                
                this.cachedSkills.set(`${skillId}:${version}`, cachedSkill)
                this.log.debug("Loaded cached skill", { skillId, version, path: versionDir })
              }
            }
          } catch (error) {
            this.log.warn("Failed to load cached skill", { skillId, error })
          }
        }
      }
      
      this.log.info("Cached skills loaded", { count: this.cachedSkills.size })
    } catch (error) {
      this.log.error("Failed to load cached skills", { error })
    }
  }

  async loadSkills(): Promise<void> {
    try {
      this.log.info("Loading Viking skills from API")
      
      const remoteSkills = await VikingApiClient.listSkills(
        this.config.apiUrl,
        this.config.ak,
        this.config.sk
      )

      this.skills.clear()
      
      for (const skill of remoteSkills) {
        const skillInfo: SkillInfo = {
          id: skill.skill_id,
          name: skill.display_title,
          description: skill.display_title,
          source: skill.source,
          skillId: skill.skill_id,
          latestVersion: skill.latest_version,
          updateTime: skill.update_time,
        }
        
        this.skills.set(skill.skill_id, skillInfo)
        
        const cacheKey = `${skill.skill_id}:${skill.latest_version}`
        if (!this.cachedSkills.has(cacheKey)) {
          await this.downloadAndCacheSkill(skill.skill_id, skill.latest_version)
        } else {
          this.log.debug("Skill already cached", { skillId: skill.skill_id, version: skill.latest_version })
        }
        
        await this.cleanupOldVersions(skill.skill_id, skill.latest_version)
      }

      this.log.info("Skills loaded successfully", { count: this.skills.size })
    } catch (error) {
      this.log.error("Failed to load skills", { error: error instanceof Error ? error.message : String(error) })
    }
  }

  private async downloadAndCacheSkill(skillId: string, version: string): Promise<void> {
    try {
      this.log.info("Downloading skill", { skillId, version })
      
      const detail = await VikingApiClient.getSkillDetail(
        this.config.apiUrl,
        this.config.ak,
        this.config.sk,
        skillId,
        3
      )

      if (!detail || !detail.file_info?.download_url) {
        this.log.warn("No download URL available", { skillId, version })
        return
      }

      const downloadUrl = detail.file_info.download_url
      const skillDir = path.join(this.config.cacheDir, skillId, version)
      
      await fs.mkdir(skillDir, { recursive: true })
      
      const zipPath = path.join(skillDir, `${version}.zip`)
      
      this.log.debug("Downloading skill zip", { url: downloadUrl, path: zipPath })
      
      const response = await fetch(downloadUrl)
      if (!response.ok) {
        throw new Error(`Failed to download skill: ${response.status} ${response.statusText}`)
      }
      
      const fileStream = createWriteStream(zipPath)
      await pipeline(Readable.fromWeb(response.body as any), fileStream)
      
      this.log.debug("Extracting skill zip", { path: zipPath })
      
      const { exec } = await import("child_process")
      const { promisify } = await import("util")
      const execAsync = promisify(exec)
      
      await execAsync(`unzip -o "${zipPath}" -d "${skillDir}"`)
      
      await fs.unlink(zipPath)
      
      const cachedSkill: CachedSkill = {
        skillId,
        version,
        path: skillDir,
        updateTime: Date.now(),
      }
      
      this.cachedSkills.set(`${skillId}:${version}`, cachedSkill)
      
      this.log.info("Skill downloaded and cached", { skillId, version, path: skillDir })
    } catch (error) {
      this.log.error("Failed to download and cache skill", { skillId, version, error })
    }
  }

  private async cleanupOldVersions(skillId: string, currentVersion: string): Promise<void> {
    try {
      const skillDir = path.join(this.config.cacheDir, skillId)
      const entries = await fs.readdir(skillDir, { withFileTypes: true })
      
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== currentVersion) {
          const oldVersionDir = path.join(skillDir, entry.name)
          await fs.rm(oldVersionDir, { recursive: true, force: true })
          this.cachedSkills.delete(`${skillId}:${entry.name}`)
          this.log.debug("Removed old version", { skillId, version: entry.name })
        }
      }
    } catch (error) {
      this.log.warn("Failed to cleanup old versions", { skillId, error })
    }
  }

  async loadSkillContent(skillId: string): Promise<string | null> {
    const cacheKey = `content:${skillId}`
    if (this.skillContentCache.has(cacheKey)) {
      return this.skillContentCache.get(cacheKey)!
    }

    try {
      this.log.info("Loading skill content", { skillId })
      
      const skill = this.skills.get(skillId)
      if (!skill) {
        this.log.warn("Skill not found", { skillId })
        return null
      }

      const cachedSkill = this.cachedSkills.get(`${skillId}:${skill.latestVersion}`)
      if (!cachedSkill) {
        this.log.warn("Skill not cached", { skillId, version: skill.latestVersion })
        return null
      }

      const skillMdPath = path.join(cachedSkill.path, "SKILL.md")
      const content = await fs.readFile(skillMdPath, "utf-8")
      
      // Also copy skill to opencode expected directory structure
      await this.copySkillToOpencodeDir(skillId, cachedSkill.path)
      
      this.skillContentCache.set(cacheKey, content)
      return content
    } catch (error) {
      this.log.error("Failed to load skill content", { skillId, error })
      return null
    }
  }

  private async copySkillToOpencodeDir(skillId: string, sourceDir: string): Promise<void> {
    try {
      const opencodeSkillDir = path.join(this.config.cacheDir, skillId)
      await fs.mkdir(opencodeSkillDir, { recursive: true })
      
      // Copy SKILL.md file
      const sourceSkillMd = path.join(sourceDir, "SKILL.md")
      const destSkillMd = path.join(opencodeSkillDir, "SKILL.md")
      
      if (await fs.stat(sourceSkillMd).then(() => true).catch(() => false)) {
        await fs.copyFile(sourceSkillMd, destSkillMd)
        this.log.debug("Copied skill to opencode directory", { skillId, dest: destSkillMd })
      }
      
      // Copy reference directory if exists
      const sourceRefDir = path.join(sourceDir, "reference")
      const destRefDir = path.join(opencodeSkillDir, "reference")
      
      if (await fs.stat(sourceRefDir).then(() => true).catch(() => false)) {
        await fs.cp(sourceRefDir, destRefDir, { recursive: true })
        this.log.debug("Copied reference directory", { skillId, dest: destRefDir })
      }
      
    } catch (error) {
      this.log.warn("Failed to copy skill to opencode directory", { skillId, error })
    }
  }

  getAllSkills(): SkillInfo[] {
    return Array.from(this.skills.values())
  }

  getSkillCount(): number {
    return this.skills.size
  }

  searchSkills(query: string): SkillInfo[] {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.skills.values()).filter(
      (skill) =>
        skill.name.toLowerCase().includes(lowerQuery) ||
        skill.id.toLowerCase().includes(lowerQuery)
    )
  }

  getSkill(skillId: string): SkillInfo | undefined {
    return this.skills.get(skillId)
  }

  getCachedSkillPath(skillId: string, version: string): string | null {
    const cachedSkill = this.cachedSkills.get(`${skillId}:${version}`)
    return cachedSkill ? cachedSkill.path : null
  }
}
