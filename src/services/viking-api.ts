import z from "zod"
import { Signer } from "@volcengine/openapi"
import type { RequestObj } from "@volcengine/openapi/lib/base/types"

export namespace VikingApiClient {
  const log = {
    info: (message: string, data?: any) => console.log(`[viking-api] ${message}`, data || ''),
    warn: (message: string, data?: any) => console.warn(`[viking-api] ${message}`, data || ''),
    error: (message: string, data?: any) => console.error(`[viking-api] ${message}`, data || ''),
    debug: (message: string, data?: any) => console.debug(`[viking-api] ${message}`, data || ''),
  }

  export const RemoteSkillInfo = z.object({
    skill_id: z.string(),
    display_title: z.string(),
    create_time: z.number(),
    latest_version: z.string(),
    source: z.string(),
    permission_config: z.object({
      scope: z.string(),
      allowed_customs: z.any().nullable(),
    }),
    update_time: z.number(),
    total_retrievals: z.number(),
  })
  export type RemoteSkillInfo = z.infer<typeof RemoteSkillInfo>

  export const SkillBasicInfo = z.object({
    skill_id: z.string(),
    version: z.string(),
    name: z.string(),
    description: z.string(),
    create_time: z.number(),
    total_retrievals: z.number().nullable(),
    level1_retrievals: z.any().nullable(),
    level2_retrievals: z.any().nullable(),
    level3_retrievals: z.any().nullable(),
  })

  export const FileInfo = z.object({
    root_path: z.string(),
    skill_files: z.array(z.string()).nullable(),
    download_url: z.string(),
  })

  export const RemoteSkillDetail = z.object({
    skill_basic: SkillBasicInfo,
    skill_content: z.string(),
    file_info: FileInfo,
  })
  export type RemoteSkillDetail = z.infer<typeof RemoteSkillDetail>

  export const SkillListResponse = z.object({
    count: z.number(),
    total_num: z.number(),
    result_list: z.array(RemoteSkillInfo),
  })

  export const SkillDetailResponse = z.object({
    skill_basic: SkillBasicInfo,
    skill_content: z.string(),
    file_info: FileInfo,
  })

  async function getAuthHeaders(
    ak: string, 
    sk: string, 
    pathname: string, 
    method: 'GET' | 'POST',
    body?: string
  ): Promise<Record<string, string>> {
    const requestObj: RequestObj = {
      region: 'cn-beijing',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      method,
      body,
      pathname,
    }

    const signer = new Signer(requestObj, 'air')
    signer.addAuthorization({
      accessKeyId: ak,
      secretKey: sk,
    })
    
    return requestObj.headers
  }

  export async function listSkills(apiUrl: string, ak: string, sk: string): Promise<RemoteSkillInfo[]> {
    try {
      const requestBody = JSON.stringify({
        offset: 0,
        limit: 1000,
        permission_scope: "public",
      })

      log.info("Fetching remote skills list", { url: `${apiUrl}/api/v1/skills/list` })

      const headers = await getAuthHeaders(
        ak,
        sk,
        "/api/v1/skills/list",
        "POST",
        requestBody
      )

      const response = await fetch(`${apiUrl}/api/v1/skills/list`, {
        method: "POST",
        headers: headers,
        body: requestBody,
      })

      if (!response.ok) {
        const errorText = await response.text()
        log.error("Failed to fetch skill list", { status: response.status, error: errorText })
        throw new Error(`Failed to fetch skill list: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const parsed = SkillListResponse.safeParse(data)

      if (!parsed.success) {
        log.error("Invalid skill list response", { issues: parsed.error.issues })
        throw new Error(`Invalid skill list response: ${JSON.stringify(parsed.error.issues)}`)
      }

      log.info("Successfully loaded remote skills", { count: parsed.data.result_list.length })
      return parsed.data.result_list
    } catch (error) {
      log.error("Failed to load remote skills", { error: error instanceof Error ? error.message : String(error) })
      return []
    }
  }

  export async function getSkillDetail(apiUrl: string, ak: string, sk: string, skillId: string, retrieveLevel: number = 3): Promise<RemoteSkillDetail | null> {
    try {
      const requestBody = JSON.stringify({
        skill_id: skillId,
        version: "latest",
        retrieve_level: retrieveLevel,
      })

      log.info("Fetching remote skill detail", { url: `${apiUrl}/api/v1/skills/version/retrieve`, skillId, retrieveLevel })

      const headers = await getAuthHeaders(
        ak,
        sk,
        "/api/v1/skills/version/retrieve",
        "POST",
        requestBody
      )

      const response = await fetch(`${apiUrl}/api/v1/skills/version/retrieve`, {
        method: "POST",
        headers: headers,
        body: requestBody,
      })

      if (!response.ok) {
        const errorText = await response.text()
        log.error("Failed to fetch skill detail", { skillId, status: response.status, error: errorText })
        throw new Error(`Failed to fetch skill detail: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const parsed = SkillDetailResponse.safeParse(data)

      if (!parsed.success) {
        log.error("Invalid skill detail response", { skillId, issues: parsed.error.issues })
        throw new Error(`Invalid skill detail response: ${JSON.stringify(parsed.error.issues)}`)
      }

      log.info("Successfully loaded remote skill detail", { skillId })
      return parsed.data
    } catch (error) {
      log.error("Failed to load skill detail", { skillId, error: error instanceof Error ? error.message : String(error) })
      return null
    }
  }
}
