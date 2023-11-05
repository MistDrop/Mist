/*
 * Copyright 2016 - 2022 Drew Edwards, tmpim
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
 * along with Mist. If not, see <http://www.gnu.org/licenses/>.
 *
 * For more project information, see <https://github.com/tmpim/krist>.
 */

import chalk from "chalk";

import { Address, Block, db } from "../src/database";
import { redis, rKey } from "../src/database/redis";
import { REDIS_PREFIX, TEST_DEBUG } from "../src/utils/constants";

export async function seed(): Promise<void> {
  const debug = !!TEST_DEBUG;

  // Cowardly refuse to wipe the databases if the database name is 'mist'
  // (production username)
  if (db.getDatabaseName() === "mist")
    throw new Error("Refusing to wipe production databases in test runner. Check environment variables!!");

  // Clear the databases
  if (debug) console.log(chalk`{red [Tests]} Clearing the database {bold ${db.getDatabaseName()}}`);
  await db.sync({ force: true });

  if (debug) console.log(chalk`{red [Tests]} Seeding the database {bold ${db.getDatabaseName()}}`);
  await Promise.all([
    // Create the genesis block
    Block.create({
      value: 50,
      hash: "0000000000000000000000000000000000000000000000000000000000000000",
      address: "0000000000",
      nonce: 0,
      difficulty: 4294967295,
      time: new Date()
    }),

    // Create some addresses to test with
    Address.bulkCreate([
      { address: "k8juvewcui", balance: 10, totalin: 0, totalout: 0, firstseen: new Date(), privatekey: "a350fa569fc53804c4282afbebafeba973c33238704815ea41fa8eec1f13a791" },
      { address: "k7oax47quv", balance: 0, totalin: 0, totalout: 0, firstseen: new Date(), privatekey: "1f71334443b70c5c384894bc6308e9fcfb5b3103abb82eba6cd26d7767b5740c" },
      { address: "kwsgj3x184", balance: 0, totalin: 0, totalout: 0, firstseen: new Date(), privatekey: "75185375f6e1e0eecbbe875355de2e38b7e548efbc80985479f5870967dcd2df", alert: "Test alert", locked: true },
      { address: "k0duvsr4qn", balance: 25000, totalin: 0, totalout: 0, firstseen: new Date(), privatekey: "4827fb69dbc85b39204595dc870029d2a390a67b5275bd4588ae6567c01397d5" },
    ])
  ]);

  // Reset the Redis database
  const redisKeys = await redis.keys(REDIS_PREFIX + "*");

  if (debug) console.log(chalk`{red [Tests]} Clearing {bold ${redisKeys.length}} redis keys with prefix {bold ${REDIS_PREFIX}}`);
  await Promise.all(redisKeys.map(key => redis.del(key)));

  await redis.set(rKey("work"), 100000);
  await redis.set(rKey("mining-enabled"), "true");
}
