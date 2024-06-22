/*
 * Copyright 2016 - 2024 Drew Edwards, tmpim
 *
 * This file is part of Krist.
 *
 * Krist is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Krist is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Krist. If not, see <http://www.gnu.org/licenses/>.
 *
 * For more project information, see <https://github.com/tmpim/Krist/>.
 */

import "dotenv/config";

import chalkT from "chalk-template";
import whyIsNodeRunning from "why-is-node-running";
import packageJson from "../package.json" with { type: "json" };
import { initDatabase, shutdownDb } from "./database/index.js";
import { initRedis, shutdownRedis } from "./database/redis.js";
import { initAuthLogCleanup, shutdownAuthLogCleanup } from "./mist/authLog.js";
import { initMist } from "./mist/index.js";
import { initWorkOverTime, shutdownWorkOverTime } from "./mist/work.js";
import { initCriticalLogUpdater } from "./utils/criticalLog.js";

import { checkEnvVars } from "./utils/index.js";
import { initWebserver, shutdownWebserver } from "./webserver/index.js";
import { initWebSocketIpc, shutdownWebSocketIpc } from "./websockets/ipc.js";

async function main() {
  console.log(chalkT`Starting {bold ${packageJson.name}} {blue ${packageJson.version}}...`);

  checkEnvVars();
  await initRedis();
  await initDatabase();
  await initMist();
  initWorkOverTime();
  initAuthLogCleanup();
  initCriticalLogUpdater();
  await initWebSocketIpc();
  await initWebserver();

  console.log(chalkT`{bold ${packageJson.name}} {blue ${packageJson.version}} is ready!`);
}

function shutdown() {
  (async () => {
    shutdownWebserver();
    await shutdownRedis();
    await shutdownDb();
    shutdownWorkOverTime();
    shutdownAuthLogCleanup();
    shutdownWebSocketIpc();
  })().catch(console.error);

  setTimeout(() => {
    console.log("Still shutting down?");
    whyIsNodeRunning();
  }, 8000).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

main().catch(console.error);
