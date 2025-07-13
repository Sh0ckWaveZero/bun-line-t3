import { handleCommand } from ".";

export const handleText = async (req: any, message: string): Promise<void> => {
  console.log("📝 handleText received message:", message);
  const commandList: any[] = message.split(" ");
  const command = commandList[0]?.slice(1).toLowerCase();
  const currency = commandList.slice(1).filter((c) => c !== "");

  console.log("📝 Parsed command:", command);
  console.log("📝 Parsed currency:", currency);
  console.log("📝 Full commandList:", commandList);

  handleCommand(command, currency, req);
};
