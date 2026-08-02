import type { CommandDefinition } from "@/features/line/commands/command-registry";

export function buildAvailableCommandsContext(
  commands: readonly CommandDefinition[],
): string {
  return commands
    .map((cmd) => {
      const aliases = cmd.aliases.length > 0 ? cmd.aliases.join(", ") : "ไม่มี";
      const keywords =
        cmd.keywords.length > 0 ? cmd.keywords.join(", ") : "ไม่มี";
      const parameters = cmd.parameters?.length
        ? cmd.parameters
            .map(
              (parameter) =>
                `${parameter.name} (${parameter.type}): ${parameter.description}`,
            )
            .join("; ")
        : "ไม่มี";
      const examples =
        cmd.examples.length > 0 ? cmd.examples.join(" | ") : "ไม่มี";

      return [
        `command: ${cmd.command}`,
        `aliases: ${aliases}`,
        `description: ${cmd.descriptionTH}`,
        `description_en: ${cmd.descriptionEN}`,
        `keywords: ${keywords}`,
        `category: ${cmd.category}`,
        `parameters: ${parameters}`,
        `examples: ${examples}`,
      ].join("\n");
    })
    .join("\n\n");
}
