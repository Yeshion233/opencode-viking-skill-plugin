import type { Plugin, PluginInput } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import { Config } from "./services/config"
import { SkillManager } from "./services/skill-manager"

export const VikingSkillPlugin: Plugin = async (ctx: PluginInput) => {
  const log = {
    info: (message: string, data?: any) => console.log(`[viking-skill-plugin] ${message}`, data || ''),
    warn: (message: string, data?: any) => console.warn(`[viking-skill-plugin] ${message}`, data || ''),
    error: (message: string, data?: any) => console.error(`[viking-skill-plugin] ${message}`, data || ''),
    debug: (message: string, data?: any) => console.debug(`[viking-skill-plugin] ${message}`, data || ''),
  }
  
  const config = Config.getConfig()

  if (!config) {
    log.warn("Viking Skill Plugin disabled - API credentials not configured")
    return {}
  }

  const skillManager = new SkillManager(config)
  await skillManager.initialize()

  log.info("Viking Skill Plugin initialized", { 
    apiUrl: config.apiUrl,
    skillCount: skillManager.getSkillCount()
  })

  return {
    "chat.message": async (input, output) => {
      // Inject available Viking skills into context on first message
      const skills = skillManager.getAllSkills()
      if (skills.length === 0) return

      const skillList = skills
        .map(s => `  - ${s.name}: ${s.description}`)
        .join("\n")

      const context = `
[Viking Skills Available]
The following Viking skills are available for use:
${skillList}

Use the skill tool with the skill name to load detailed instructions.
      `.trim()

      const contextPart: any = {
        id: `viking-skills-context-${Date.now()}`,
        sessionID: input.sessionID,
        messageID: output.message.id,
        type: "text",
        text: context,
        synthetic: true,
      }
      
      output.parts.unshift(contextPart)
    },

    tool: {
      viking_skill: tool({
        description: "Load and use Viking remote skills for specialized tasks",
        args: {
          mode: tool.schema.enum(["list", "load", "search", "reload"]).optional(),
          name: tool.schema.string().optional(),
          query: tool.schema.string().optional(),
        },
        async execute(args: {
          mode?: string
          name?: string
          query?: string
        }) {
          const mode = args.mode || "list"

          try {
            switch (mode) {
              case "list": {
                const skills = skillManager.getAllSkills()
                return JSON.stringify({
                  success: true,
                  count: skills.length,
                  skills: skills.map((s) => ({
                    id: s.id,
                    name: s.name,
                    description: s.description,
                    source: s.source,
                  })),
                })
              }

              case "load": {
                if (!args.name) {
                  return JSON.stringify({
                    success: false,
                    error: "name parameter is required for load mode",
                  })
                }

                const content = await skillManager.loadSkillContent(args.name)
                if (!content) {
                  return JSON.stringify({
                    success: false,
                    error: `Skill "${args.name}" not found`,
                  })
                }

                return JSON.stringify({
                  success: true,
                  skill: {
                    name: args.name,
                    content,
                  },
                })
              }

              case "search": {
                if (!args.query) {
                  return JSON.stringify({
                    success: false,
                    error: "query parameter is required for search mode",
                  })
                }

                const skills = skillManager.searchSkills(args.query)
                return JSON.stringify({
                  success: true,
                  count: skills.length,
                  skills: skills.map((s) => ({
                    id: s.id,
                    name: s.name,
                    description: s.description,
                    source: s.source,
                  })),
                })
              }

              case "reload": {
                await skillManager.loadSkills()
                return JSON.stringify({
                  success: true,
                  message: "Skills reloaded successfully",
                  count: skillManager.getSkillCount(),
                })
              }

              default:
                return JSON.stringify({
                  success: false,
                  error: `Unknown mode: ${mode}`,
                })
            }
          } catch (error) {
            return JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error),
            })
          }
        },
      }),
    },
  }
}
