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

import dayjs from "dayjs";
import { Router } from "express";
import { PaginatedQuery, ReqQuery, returnPaginatedResult } from "..";
import { ctrlGetBlock, ctrlGetLastBlock } from "../../controllers/blocks";
import { blockToJson, getBlock, getBlocks, getBlockValue, getLastBlock, getLowestHashes } from "../../mist/blocks";
import { getBaseBlockValue, padDigits } from "../../utils";

/**
 * @apiDefine BlockGroup Blocks
 *
 * All Block related endpoints.
 */

/**
 * @apiDefine Block
 *
 * @apiSuccess {Object} block
 * @apiSuccess {Number} block.height The height (ID) of this block.
 * @apiSuccess {String} block.address The address which submitted this block.
 * @apiSuccess {String} block.hash The full-length SHA-256 hash of this block.
 *            The hash is calculated by the SHA-256 of the submitter's address,
 *            the 12-char SHA-256 of the last block, and the nonce.
 * @apiSuccess {String} block.short_hash The hash trimmed to 12 characters.
 * @apiSuccess {Number} block.value The reward value of this block.
 * @apiSuccess {Number} block.difficulty The difficulty at the time the block
 * was mined.
 * @apiSuccess {Number} block.x The X coordinate of the block.
 * @apiSuccess {Number} block.y The Y coordinate of the block.
 * @apiSuccess {Number} block.z The Z coordinate of the block.
 * @apiSuccess {Date} block.time The time this block was submitted, as an
 * ISO-8601 string.
 */

/**
 * @apiDefine Blocks
 *
 * @apiSuccess {Object[]} blocks
 * @apiSuccess {Number} blocks.height The height (ID) of this block.
 * @apiSuccess {String} blocks.address The address which submitted this block.
 * @apiSuccess {String} blocks.hash The full-length SHA-256 hash of this block.
 *            The hash is calculated by the SHA-256 of the submitter's address,
 *            the 12-char SHA-256 of the last block, and the nonce.
 * @apiSuccess {String} blocks.short_hash The hash trimmed to 12 characters.
 * @apiSuccess {Number} blocks.value The reward value of this block.
 * @apiSuccess {Number} blocks.difficulty The difficulty at the time the block
 * was mined.
 * @apiSuccess {Number} blocks.x The X coordinate of the block.
 * @apiSuccess {Number} blocks.y The Y coordinate of the block.
 * @apiSuccess {Number} blocks.z The Z coordinate of the block.
 * @apiSuccess {Date} blocks.time The time this block was submitted, as an
 * ISO-8601 string.
 */

export default (): Router => {
  const router = Router();
  /**
	 * @api {get} /blocks List all blocks
	 * @apiName GetBlocks
	 * @apiGroup BlockGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiUse LimitOffset
	 *
	 * @apiSuccess {Number} count The count of results.
	 * @apiSuccess {Number} total The total amount of blocks.
	 * @apiUse Blocks
	 *
	 * @apiSuccessExample {json} Success
	 * {
   *     "ok": true,
   *     "count": 49,
   *     "total": 100000
   *     "blocks": [
   *         {
   *             "height": 2,
   *             "address": "a5dfb396d3",
   *             "hash": "00480dc35dc111d9953e5182df7d7f404a62d2b0d71ed51a873a81d89e78fbd8",
   *             "short_hash": "00480dc35dc1",
   *             "value": 50,
   *             "time": "2015-02-14T20:42:30.000Z"
   *         },
   *         {
   *             "height": 3,
   *             "address": "a5dfb396d3",
   *             "hash": "0046a3582fed130ee18c05e7e278992678d46e311465a4af6b787f5c014640a9",
   *             "short_hash": "0046a3582fed",
   *             "value": 50,
   *             "time": "2015-02-14T20:48:43.000Z"
   *         },
	 *  	   ...
	 */
  router.get("/blocks", async (req: PaginatedQuery, res) => {
    const results = await getBlocks(req.query.limit, req.query.offset, true);
    returnPaginatedResult(res, "blocks", blockToJson, results);
  });

    /**
	 * @api {get} /blocks/latest List latest blocks
	 * @apiName GetLatestBlocks
	 * @apiGroup BlockGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiUse LimitOffset
	 *
	 * @apiSuccess {Number} count The count of results.
	 * @apiUse Blocks
	 *
	 * @apiSuccessExample {json} Success
	 * {
   *     "ok": true,
   *     "count": 50,
   *     "blocks": [
   *         {
   *             "height": 122225,
   *             "address": "mre3w0i79j",
   *             "hash": "1aa36f210f2e07b666646ac7dac3ea972262a6a474419edfc058e4402d40538d",
   *             "short_hash": "1aa36f210f2e",
   *             "value": 12,
   *             "time": "2016-02-02T17:55:35.000Z"
   *         },
   *         {
   *             "height": 122224,
   *             "address": "m123456789",
   *             "hash": "000000f31b3ca2cf166d0ee669cd2ae2be6ea0fc35d1cf1e7b52811ecb358796",
   *             "short_hash": "000000f31b3c",
   *             "value": 12,
   *             "time": "2016-02-01T14:18:47.000Z"
   *         },
	 *  	   ...
	 */
  router.get("/blocks/latest", async (req: PaginatedQuery, res) => {
    const results = await getBlocks(req.query.limit, req.query.offset);
    returnPaginatedResult(res, "blocks", blockToJson, results);
  });

    /**
	 * @api {get} /blocks/lowest List blocks with the lowest hash
	 * @apiName GetLowestBlocks
	 * @apiGroup BlockGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiUse LimitOffset
	 *
	 * @apiSuccess {Number} count The count of results.
	 * @apiUse Blocks
	 *
	 * @apiSuccessExample {json} Success
	 * {
   *     "ok": true,
   *     "count": 43,
   *     "blocks": [
   *         {
   *             "height": 110128,
   *             "address": "m5ztameslf",
   *             "hash": "000000000000fd42f2c046d9c0f99b6534c1e04a87902ebff7ed4396d1f5b4ea",
   *             "short_hash": "000000000000",
   *             "value": 12,
   *             "time": "2016-01-22T00:09:17.000Z"
   *         },
   *         {
   *             "height": 113253,
   *             "address": "m5ztameslf",
   *             "hash": "000000000001285d349f8781ac4f1d155472178e1150c0eb6a1cf4e441320f2c",
   *             "short_hash": "000000000001",
   *             "value": 14,
   *             "time": "2016-01-24T22:10:49.000Z"
   *         },
	 *  	   ...
	 */
  router.get("/blocks/lowest", async (req: PaginatedQuery, res) => {
    const results = await getLowestHashes(req.query.limit, req.query.offset);
    returnPaginatedResult(res, "blocks", blockToJson, results);
  });

    /**
	 * @api {get} /blocks/last Get the last block
	 * @apiName GetLastBlock
	 * @apiGroup BlockGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiUse Block
	 *
	 * @apiSuccessExample {json} Success
	 * {
   *     "ok": true,
   *     "block": {
   *         "height": 122225,
   *         "address": "mre3w0i79j",
   *         "hash": "1aa36f210f2e07b666646ac7dac3ea972262a6a474419edfc058e4402d40538d",
   *         "short_hash": "1aa36f210f2e",
   *         "value": 12,
   *         "time": "2016-02-02T17:55:35.000Z"
   *     }
   * }
	 */
  router.get("/blocks/last", async (req, res) => {
    const block = await ctrlGetLastBlock();
    res.json({
      ok: true,
      block: blockToJson(block)
    });
  });

    /**
	 *
	 * @api {get} /blocks/value Get the block reward
	 * @apiName GetBlockValue
	 * @apiGroup BlockGroup
	 * @apiVersion 2.0.6
	 *
	 * @apiSuccess {Number} value - The current block reward.
	 * @apiSuccess {Number} base_value - The base block reward.
	 *
	 * @apiDescription Returns the block reward - the base value plus the amount
	 *           of unpaid names (names registered in the last 500 blocks). This
	 *           is how much Krist will be rewarded for mining a block right now.
	 *
	 * @apiSuccessExample {json} Success
	 * {
   *     "ok": true,
   *     "value": 2,
   *     "base_value": 1
   * }
	 */
  router.get(["/blocks/value", "/blocks/basevalue"], async (req, res) => {
    const block = await ctrlGetLastBlock();
    const blockValue = await getBlockValue();

    res.json({
      ok: true,
      value: blockValue,
      base_value: getBaseBlockValue(block.id)
    });
  });

    /**
	 * @api {get} /blocks/:height Get a block
	 * @apiName GetBlock
	 * @apiGroup BlockGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiParam {String} height The height of the block.
	 *
	 * @apiUse Block
	 *
	 * @apiSuccessExample {json} Success
	 * {
   *     "ok": true,
   *     "block": {
   *         "height": 5000,
   *         "address": "b5591107c4",
   *         "hash": "0000003797c090eb72d87a391aeedbef89957f9627aea9807870df46eb13a7e3",
   *         "short_hash": "0000003797c0",
   *         "value": 50,
   *         "time": "2015-02-21T11:05:47.000Z"
   *     }
   * }
	 */
  router.get("/blocks/:height", async (req, res) => {
    const block = await ctrlGetBlock(req.params.height);
    res.json({
      ok: true,
      block: blockToJson(block)
    });
  });

  // ===========================================================================
  // Legacy API
  // ===========================================================================
  router.get("/", async (req: ReqQuery<{
    lastblock?: string;
    getbaseblockvalue?: string;
    getblockvalue?: string;
    blocks?: string;
    low?: string;
  }>, res, next) => {
    if (req.query.lastblock !== undefined) {
      const block = await getLastBlock();
      if (!block) return res.send("000000000000");
      return res.send(block.hash.substring(0, 12));
    }

    if (req.query.getbaseblockvalue !== undefined) {
      const block = await getLastBlock();
      if (!block) return res.send("50");
      return res.send(getBaseBlockValue(block.id).toString());
    }

    if (req.query.getblockvalue) {
      const n = Math.max(parseInt(req.query.getblockvalue), 0);
      const block = await getBlock(n);
      if (!block) return res.send("50");
      return res.send(block.value.toString());
    }

    if (req.query.blocks !== undefined) {
      if (req.query.low !== undefined) {
        const blocks = await getLowestHashes();

        const lines = blocks.rows.map(block => {
          // Skip the genesis block
          if (!block.hash || block.id < 10) return;

          return dayjs(block.time).format("MMM DD")
            + padDigits(block.id, 6)
            + block.hash.substring(0, 20);
        });

        return res.send(lines.join(""));
      } else {
        const blocks = await getBlocks(50);

        const lines = blocks.rows.map((block, i) => {
          if (!block.hash || block.id < 10) return;

          // Header row
          const header = i === 0
            ? padDigits(block.id, 8) + dayjs(block.time).format("YYYY-MM-DD")
            : "";

          return header
            + dayjs(block.time).format("HH:mm:ss")
            + block.address.substring(0, 10)
            + block.hash.substring(0, 12);
        });

        return res.send(lines.join(""));
      }
    }

    next();
  });

  return router;
};
