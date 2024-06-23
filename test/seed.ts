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
import { Address, Block, db } from "../src/database/index.js";
import { redis, rKey } from "../src/database/redis.js";
import { REDIS_PREFIX, TEST_DEBUG } from "../src/utils/vars.js";

export async function seed(): Promise<void> {
  const debug = TEST_DEBUG;

  // Cowardly refuse to wipe the databases if the database name is 'mist' (production username)
  const dbName = (db.options.replication.write as any).database;
  if (dbName === "mist")
    throw new Error("Refusing to wipe production databases in test runner. Check environment variables!!");

  // Clear the databases
  if (debug) console.log(chalkT`{red [Tests]} Clearing the database {bold ${dbName}}`);
  await db.sync({ force: true });

  if (debug) console.log(chalkT`{red [Tests]} Seeding the database {bold ${dbName}}`);
  await Promise.all([
    // Create the genesis block
    Block.create({
      value: 50,
      hash: "0000000000000000000000000000000000000000000000000000000000000000",
      address: "0000000000",
      nonce: "0",
      difficulty: 4294967295,
      time: new Date()
    }),

    // Create some addresses to test with
    // TODO: Don't hardcode private keys
    Address.bulkCreate([
      { address: "m8juvewcui", balance: 10, totalin: 0, totalout: 0, firstseen: new Date(), privatekey: "7119a5f50dac903c3c52751abe441f748e86ffd15e50622ad1707518f569a11e" },
      { address: "m7oax47quv", balance: 0, totalin: 0, totalout: 0, firstseen: new Date(), privatekey: "6db084a3fdc6336f4fc76d2d88f2950170c7c6820d7bfe68cc0b3abe9d345705" },
      { address: "mwsgj3x184", balance: 0, totalin: 0, totalout: 0, firstseen: new Date(), privatekey: "74aa17eb08c411d5f794c08fc824b2e6447ba19bdd1c0af1e3f2769df70c1b26", alert: "Test alert", locked: true },
      { address: "m0duvsr4qn", balance: 25000, totalin: 0, totalout: 0, firstseen: new Date(), privatekey: "49f63b09a79b222a827f8052f7734900c096edb4118c98beb3756fc747012c07" },
    ])
  ]);

  // Reset the Redis database
  const redisKeys = await redis.keys(REDIS_PREFIX + "*");

  if (debug) console.log(chalkT`{red [Tests]} Clearing {bold ${redisKeys.length}} redis keys with prefix {bold ${REDIS_PREFIX}}`);
  await Promise.all(redisKeys.map(key => redis.del(key)));

  await redis.set(rKey("work"), 100000);
  await redis.set(rKey("mining-enabled"), "true");
  await redis.set(rKey("transactions-enabled"), "true");
}
