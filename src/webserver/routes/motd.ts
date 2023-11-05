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

import { Router } from "express";
import { getDetailedMotd } from "../../mist/motd";

export default (): Router => {
  const router = Router();

  /**
	 * @api {get} /motd Get information about the Mist server (MOTD)
	 * @apiName GetMOTD
	 * @apiGroup MiscellaneousGroup
	 * @apiVersion 2.6.4
	 *
	 * @apiSuccess {String} motd The message of the day
	 * @apiSuccess {Date} set The date the MOTD was last changed (provided for
   *   backwards compatibility)
	 * @apiSuccess {Date} motd_set The date the MOTD was last changed, as an
	 *   ISO-8601 string
	 * @apiSuccess {Date} server_time The current server time, as an ISO-8601
	 *   string
   *
	 * @apiSuccess {String} public_url The public URL of this Mist node.
	 * @apiSuccess {String} public_ws_url The public URL of the Websocket gateway.
   * @apiSuccess {Boolean} mining_enabled If mining is enabled on the server,
   *  this will be set to `true`.
	 * @apiSuccess {Number} work The current Krist work (difficulty).
	 * @apiSuccess {Object} last_block The last block mined on the Krist node. May
   *   be `null`.
   *
	 * @apiSuccess {Object} package Information related to this build of the Mist
   *    source code.
	 * @apiSuccess {String} package.name The name of the package (always `mist`).
	 * @apiSuccess {String} package.version The version of the Mist server.
	 * @apiSuccess {String} package.author The author of the Mist server (always
   *    `Lemmmy`)
	 * @apiSuccess {String} package.license The license of the Mist server
   *    (always `GPL-3.0`)
	 * @apiSuccess {String} package.repository The repository of the Mist server
   *    source code.
   *
	 * @apiSuccess {Object} constants Constants related to the Mist server
   *    configuration.
   * @apiSuccess {Number} constants.wallet_version The latest version of
   *    MistWallet.
   * @apiSuccess {Number} constants.nonce_max_size The maximum size, in bytes,
   *  of a block nonce.
   * @apiSuccess {Number} constants.name_cost The cost, in MST, of purchasing a
   *    new name.
   * @apiSuccess {Number} constants.min_work The minimum work (block difficulty)
   *    value. The work will not automatically go below this.
   * @apiSuccess {Number} constants.max_work The maximum work (block difficulty)
   *    value. The work will not automatically go above this.
   * @apiSuccess {Number} constants.work_factor Work adjustment rate per block,
   *    where 1 means immediate adjustment to target work and 0 means constant
   *    work.
   * @apiSuccess {Number} constants.seconds_per_block The ideal time between
   *    mined blocks. The Krist server will adjust the difficulty to match this
   *    value.
   *
	 * @apiSuccess {Object} currency Constants related to the currency that this
   *    server represents.
   * @apiSuccess {String} currency.address_prefix The character that each
   *    address starts with (e.g. `k`).
   * @apiSuccess {String} currency.name_suffix The suffix that each name ends
   *    with after the dot (e.g. `mst`)
   * @apiSuccess {String} currency.currency_name The full long name of this
   *    currency (e.g. `Mist`).
   * @apiSuccess {String} currency.currency_symbol The shorthand symbol for this
   *    currency (e.g. `MST`).
   *
   * @apiSuccess {String} notice Required copyright notice for the Mist server.
	 *
	 * @apiSuccessExample {json} Success
   * {
   *    "ok": true,
   *    "server_time": "2023-03-22T21:14:29.483Z",
   *    "motd": "The API URL has changed to https://mist.dev\n\nBlock submission is disabled ([more info](https://discord.sc3.io))",
   *    "set": "2023-03-22T21:14:06.000Z",
   *    "motd_set": "2023-03-22T21:14:06.000Z",
   *    "public_url": "mist.dev",
   *    "public_ws_url": "ws.mist.dev",
   *    "mining_enabled": false,
   *    "debug_mode": false,
   *    "work": 100000,
   *    "last_block": {
   *       "height": 2121616,
   *       "address": "mistdeath",
   *       "hash": "00000000009f16ac5ded918793310016ea2d61a29d5a328e244cd8478da6924c",
   *       "short_hash": "00000000009f",
   *       "value": 1,
   *       "time": "2022-07-19T20:43:09.000Z",
   *       "difficulty": 551
   *    },
   *    "package": {
   *       "name": "mist",
   *       "version": "3.3.0",
   *       "author": "Lemmmy",
   *       "licence": "GPL-3.0",
   *       "repository": "https://github.com/MistDrop/Mist"
   *    },
   *    "constants": {
   *       "wallet_version": 16,
   *       "nonce_max_size": 24,
   *       "name_cost": 500,
   *       "min_work": 100,
   *       "max_work": 100000,
   *       "work_factor": 0.025,
   *       "seconds_per_block": 60
   *    },
   *    "currency": {
   *       "address_prefix": "k",
   *       "name_suffix": "mst",
   *       "currency_name": "Mist",
   *       "currency_symbol": "MST"
   *    },
   *    "notice": "Mist was originally created by 3d6 and Lemmmy. It is now owned and operated by tmpim, and licensed under GPL-3.0."
   * }
	 */
  router.all("/motd", async (req, res) => {
    // Stringify to prettify output
    res.header("Content-Type", "application/json");
    return res.send(JSON.stringify({
      ok: true,
      ...await getDetailedMotd()
    }, null, 2));
  });

  return router;
};
