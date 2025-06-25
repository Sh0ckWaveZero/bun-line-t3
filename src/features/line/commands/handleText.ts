import { handleCommand } from ".";

export const handleText = async (req: any, message: string): Promise<void> => {
  const commandList: any[] = message.split(" ");
  const command = commandList[0]?.slice(1).toLowerCase();
  const currency = commandList.slice(1).filter((c) => c !== "");

  handleCommand(command, currency, req);
};
