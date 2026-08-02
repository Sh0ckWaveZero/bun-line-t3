import {
  routeCommand,
  type CommandContext,
  type CommandRouteResponse,
} from "@/lib/ai/openai-client";
import { buildAvailableCommandsContext } from "@/lib/ai/command-context";
import type { CommandDefinition } from "@/features/line/commands/command-registry";

/**
 * Route natural language to appropriate LINE command using AI
 *
 * @param naturalLanguage - User's natural language input
 * @param commands - Available command definitions
 * @returns AI response with command, parameters, and confidence
 */
export async function routeNaturalLanguageToCommand(
  naturalLanguage: string,
  commands: readonly CommandDefinition[],
): Promise<CommandRouteResponse> {
  const availableCommands = buildAvailableCommandsContext(commands);
  const commandContext: CommandContext = {
    availableCommands,
    allowedCommands: commands.map((cmd) => cmd.command),
    allowedParametersByCommand: Object.fromEntries(
      commands.map((cmd) => [
        cmd.command,
        cmd.parameters?.map((parameter) => parameter.name) ?? [],
      ]),
    ),
  };

  // Call OpenAI to route command
  const response: CommandRouteResponse = await routeCommand({
    userMessage: naturalLanguage,
    commandContext,
  });

  return response;
}
