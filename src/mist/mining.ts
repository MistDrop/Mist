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

import { redis, rKey } from "../database/redis";
import { sha256 } from "../utils";

import { LAST_BLOCK, ORE_TYPES } from "../utils/constants";
import dayjs from "dayjs";

const cutoff = dayjs(LAST_BLOCK);

export async function isMiningEnabled(): Promise<boolean> {
  if (dayjs().isAfter(cutoff)) return false;
  return (await redis.get(rKey("mining-enabled"))) === "true";
}

export function getChunkCoord(n: number): number {
  return Math.floor(n / 16);
}

export async function getOreValue(x: number, y: number, z: number): Promise<number> {
  const chunkX = getChunkCoord(x);
  const chunkZ = getChunkCoord(z);
  let baseSeed = await redis.get(rKey("ore-seed"));
  if (!baseSeed) {
    baseSeed = sha256("ore-seed" + Math.random().toString());
    await redis.set(rKey("ore-seed"), baseSeed);
  }  
  const ores: Record<string, number> = {};
  for (let cx = chunkX - 1; cx <= chunkX + 1; cx++) {
    for (let cz = chunkZ - 1; cz <= chunkZ + 1; cz++) {
      const prng = Math.seedrandom(`${baseSeed}:${cx}:${cz}`);
      ORE_TYPES.forEach(oreType => {
        for (let i = 0; i < oreType.attempts; i++) {
          const oreStartX = Math.floor(prng() * 16) + cx * 16;
          const oreStartY = Math.floor(prng() * (oreType.yMax - oreType.yMin)) + oreType.yMin;
          const oreStartZ = Math.floor(prng() * 16) + cz * 16;
          let oreX = oreStartX;
          let oreY = oreStartY;
          let oreZ = oreStartZ;
          const oreAmount = Math.floor(prng() * (oreType.blobMax - oreType.blobMin)) + oreType.blobMin;
          for (let j = 0; j < oreAmount; j++) {
            const reset = Math.floor(prng() * 2);
            if (reset) {
              // Help ensure blobs are centered around the start point
              oreX = oreStartX;
              oreY = oreStartY;
              oreZ = oreStartZ;
            }
            const expandDir = Math.floor(prng() * 6);
            switch (expandDir) {
              case 0:
                oreX++;
                break;
              case 1:
                oreX--;
                break;
              case 2:
                oreY++;
                break;
              case 3:
                oreY--;
                break;
              case 4:
                oreZ++;
                break;
              case 5:
                oreZ--;
                break;
            }
            const oreKey = `${oreX}:${oreY + j}:${oreZ}`;
            //ores[oreKey] = oreType.value;
            if (oreX == x && oreY == y && oreZ == z) {
              return oreType.value;
            }
          }
        }
      });
    }
  }
  return 0;
}
