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

import chalkT from "chalk-template";
import { Block } from "../database/index.js";

import { redis, rKey } from "../database/redis.js";
import { MAX_WORK } from "../utils/vars.js";

import { isMiningEnabled } from "./switches.js";
import { getWork, setWork } from "./work.js";
import { makeV2Address } from "../utils/crypto.js";
import { MIN_WORK } from "../utils/vars.js";

export async function initMist(): Promise<void> {
  console.log(chalkT`{bold [Mist]} Loading...`);

  // Check if mining is enabled
  if (!await redis.exists(rKey("mining-enabled"))) {
    console.log(chalkT`{yellow.bold [Mist]} Note: Initialised with mining disabled.`);
    await redis.set(rKey("mining-enabled"), "false");
  } else {
    const miningEnabled = await isMiningEnabled();
    if (miningEnabled) console.log(chalkT`{green.bold [Mist]} Mining is enabled.`);
    else               console.log(chalkT`{red.bold [Mist]} Mining is disabled!`);
  }

  // Check if transactions are disabled
  if (!await redis.exists(rKey("transactions-enabled"))) {
    console.log(chalkT`{yellow.bold [Mist]} Note: Initialised with transactions disabled.`);
    await redis.set(rKey("transactions-enabled"), "false");
  } else {
    const txEnabled = await redis.get(rKey("transactions-enabled")) === "true";
    if (txEnabled) console.log(chalkT`{green.bold [Mist]} Transactions are enabled.`);
    else           console.log(chalkT`{red.bold [Mist]} Transactions are disabled!`);
  }

  // Check for a genesis block
  const lastBlock = await Block.findOne({ order: [["id", "DESC"]] });
  if (!lastBlock) {
    //console.log(chalkT`{yellow.bold [Mist]} Warning: Genesis block not found. Mining may not behave correctly.`);
    console.log(chalkT`{yellow.bold [Mist]} Warning: Genesis block not found. Initializing...`);
    await Block.create({
      hash: "0".repeat(64),
      address: await makeV2Address("genesis"),
      // Convert nonces to a hex string, binary or not
      nonce: "0",
      time: new Date(),
      difficulty: MIN_WORK,
      value: 0,
      useragent: "Genesis Block",
      library_agent: "Mist",
      origin: "localhost"
    });
  }

  // Pre-initialise the work to 100,000
  if (!await redis.exists(rKey("work"))) {
    const defaultWork = MAX_WORK;
    console.log(chalkT`{yellow.bold [Mist]} Warning: Work was not yet set in Redis. It will be initialised to: {green ${defaultWork}}`);
    await setWork(defaultWork);
  }
  console.log(chalkT`{bold [Mist]} Current work: {green ${await getWork()}}`);
}
