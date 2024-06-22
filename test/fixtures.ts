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
import * as chai from "chai";
import chaiHttp from "chai-http";
import sinon, { SinonSandbox } from "sinon";
import chalkT from "chalk-template";
import { initDatabase, db } from "../src/database/index.js";
import { initRedis, redis, rKey } from "../src/database/redis.js";
import { initWebserver, server } from "../src/webserver/index.js";
import { initMist } from "../src/mist/index.js";
import { shutdownWorkOverTime } from "../src/mist/work.js";
import { RootHookObject } from "mocha";

export async function mochaGlobalSetup() {
  chai.use(chaiHttp);

  await initRedis();
  await initDatabase();
  await initWebserver();
  await initMist();
}

export async function mochaGlobalTeardown() {
  console.log(chalkT`{red [Tests]} Stopping web server and database`);

  // Undo some changes made by the test runner
  await redis.set(rKey("mining-enabled"), "false");

  server.close();
  await db.close();
  shutdownWorkOverTime();
}

let sandbox: SinonSandbox;
export function mochaHooks(): RootHookObject {
  return {
    beforeEach(done) {
      // Suppress Mist's rather verbose logging during tests
      if (!process.env.TEST_DEBUG) {
        sandbox = sinon.createSandbox();
        sandbox.stub(console, "log");
      }
      done();
    },

    afterEach(done) {
      if (!process.env.TEST_DEBUG) sandbox.restore();
      done();
    }
  };
}
