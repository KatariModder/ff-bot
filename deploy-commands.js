import { REST, Routes } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const commands = [
  {
    name: "ping",
    description: "Test slash command để lấy huy hiệu"
  }
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("Deploying slash commands...");
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log("✅ Done! Slash command đã được đăng ký");
  } catch (error) {
    console.error(error);
  }
})();
