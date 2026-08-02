import type { CommandDefinition } from "@/features/line/commands/command-registry";

export function buildAvailableCommandsContext(
  commands: CommandDefinition[],
): string {
  return commands
    .map((cmd) => {
      const aliases = cmd.aliases.length > 0 ? cmd.aliases.join(", ") : "ไม่มี";
      const parameters = cmd.parameters?.length
        ? cmd.parameters
            .map(
              (parameter) =>
                `${parameter.name} (${parameter.type}): ${parameter.description}`,
            )
            .join("; ")
        : "ไม่มี";
      const examples = cmd.examples.slice(0, 3).join(" | ");

      return [
        `command: ${cmd.command}`,
        `aliases: ${aliases}`,
        `description: ${cmd.descriptionTH}`,
        `parameters: ${parameters}`,
        `examples: ${examples}`,
      ].join("\n");
    })
    .join("\n\n");
}
