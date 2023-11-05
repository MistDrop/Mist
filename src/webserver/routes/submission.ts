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

import { ReqQuery } from "..";

import { addressToJson } from "../../mist/addresses";
import { blockToJson, getLastBlock } from "../../mist/blocks";
import { ctrlSubmitBlock } from "../../controllers/blocks";

import {
  ErrorInvalidParameter, ErrorSolutionDuplicate, ErrorSolutionIncorrect,
  MistError
} from "../../errors";

export default (): Router => {
  const router = Router();

  // ===========================================================================
  // API v2
  // ===========================================================================
    /**
	 * @api {post} /submit Submit a block
	 * @apiName SubmitBlock
	 * @apiGroup BlockGroup
	 * @apiVersion 2.0.0
   * @apiDeprecated Block submission is currently disabled.
	 *
	 * @apiBody {String} address The address to send the reward
	 *   to, if successful.
	 * @apiBody {String|Number[]} nonce The nonce to submit with.
   * @apiBody {Number} x The X coordinate to mine.
   * @apiBody {Number} y The Y coordinate to mine.
   * @apiBody {Number} z The Z coordinate to mine.
	 *
	 * @apiSuccess {Boolean} success Whether the submission was successful or not.
	 * @apiSuccess {String} [error] The block submission error (if success was
   *   `false`).
	 * @apiSuccess {Number} [work] The new difficulty for block submission (if the
	 *   solution was successful).
	 * @apiUse Address
	 * @apiUse Block
	 * @apiSuccess {Object} [address] The address of the solver (if the solution
	 *   was successful).
	 * @apiSuccess {Object} [block] The block which was just submitted (if the
	 *   solution was successful).
	 *
	 * @apiSuccessExample {json} Success
	 * {
   *     "ok": true,
   *     "success": true,
   *     "work": 18750,
   *     "address": {
   *         "address": "kre3w0i79j",
   *         "balance": 925378,
   *         "totalin": 925378,
   *         "totalout": 0,
   *         "firstseen": "2015-03-13T12:55:18.000Z"
   *     },
   *     "block": {
   *         "height": 122226,
   *         "address": "kre3w0i79j",
   *         "hash": "000000007abc9f0cafaa8bf85d19817ee4f5c41ae758de3ad419d62672423ef",
   *         "short_hash": "000000007ab",
   *         "value": 14,
   *         "time": "2016-02-06T19:22:41.746Z",
   *         "x": 0,
   *         "y": 0,
   *         "z": 0
   *     }
   * }
	 *
	 * @apiSuccessExample {json} Solution Incorrect
	 * {
   *     "ok": true,
   *     "success": false,
   *     "error": "solution_incorrect"
   * }
	 *
	 * @apiSuccessExample {json} Solution Duplicate
	 * {
   *     "ok": true,
   *     "success": false,
   *     "error": "solution_duplicate"
   * }
	 *
	 * @apiErrorExample {json} Invalid Nonce
	 * {
   *     "ok": false,
   *     "error": "invalid_parameter",
   *     "parameter": "nonce"
   * }
	 */
  router.post("/submit", async (req, res) => {
    try {
      const x = req.body.x;
      const y = req.body.y;
      const z = req.body.z;
      const result = await ctrlSubmitBlock(req,
        req.body.address, req.body.nonce, x ? parseInt(x) : undefined, y ? parseInt(y) : undefined, z ? parseInt(z) : undefined);

      res.json({
        ok: true,
        success: true,
        work: result.work,
        address: addressToJson(result.address),
        block: blockToJson(result.block)
      });
    } catch (err: unknown) {
      // Catch incorrect solution errors and be sure that `ok` is `true` and
      // `success` is `false`
      if (err instanceof ErrorSolutionIncorrect
        || err instanceof ErrorSolutionDuplicate) {
        res.json({
          ok: true,
          success: false,
          error: err.errorString || "unknown_error"
        });
      } else {
        throw err;
      }
    }
  });

  // ===========================================================================
  // Legacy API
  // ===========================================================================
  router.get("/", async (req: ReqQuery<{
    submitblock?: string;
    address?: string;
    nonce?: string;
    x?: string;
    y?: string;
    z?: string;
  }>, res, next) => {
    if (req.query.submitblock !== undefined) {
      const { address, nonce, x, y, z } = req.query;

      try {
        await ctrlSubmitBlock(req, address, nonce, x ? parseInt(x) : undefined, y ? parseInt(y) : undefined, z ? parseInt(z) : undefined);
        res.send("Block solved");
      } catch (err: unknown) {
        if (err instanceof MistError) {
          // Convert v2 errors to legacy API errors
          if (err.errorString === "mining_disabled")
            return res.send("Mining disabled");

          if (err instanceof ErrorInvalidParameter) {
            if (err.parameter === "address")
              return res.send("Invalid address");
            if (err.parameter === "nonce")
              return res.send("Nonce is too large");
          }

          if (err.errorString === "solution_duplicate")
            return res.send("Solution rejected");

          if (err.errorString === "solution_incorrect") {
            // v1 API returns address + lastBlockHash + nonce for invalid
            // solutions, not sure why
            const lastBlock = await getLastBlock();
            if (!lastBlock) return res.send("Mining disabled");
            return res.send(address + lastBlock.hash.substring(0, 12) + nonce);
          }
        }

        console.error(err);
        return res.send("Unknown error");
      }

      return;
    }

    next();
  });

  return router;
};
