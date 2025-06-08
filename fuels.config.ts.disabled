import { createConfig } from "fuels";
import dotenv from "dotenv";
import { providerUrl } from "./src/lib";

dotenv.config({
  path: [".env.local", ".env"],
});

const fuelCorePort = +(process.env.VITE_FUEL_NODE_PORT as string) || 4000;

export default createConfig({
  output: "./src/sway-api",
  fuelCorePort,
  providerUrl,
});
