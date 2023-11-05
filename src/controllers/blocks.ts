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

import { Request } from "express";

import { Block, Limit, Offset, PaginatedResult } from "../database";

import {
  getBlock, getBlocks, getLastBlock, getLowestHashes
} from "../mist/blocks";
import {
  submitBlock, SubmitBlockResponse
} from "../mist/blocks/submit";

import {
  ErrorBlockNotFound, ErrorInvalidParameter, ErrorMiningDisabled,
  ErrorMissingParameter
} from "../errors";

import { isValidMistAddress, validateLimitOffset } from "../utils";
import { isNaN } from "lodash";
import { isMiningEnabled } from "../mist/mining";
import { NONCE_MAX_SIZE } from "../utils/constants";

export async function ctrlGetBlocks(
  limit: Limit,
  offset: Offset,
  asc?: boolean
): Promise<PaginatedResult<Block>> {
  await validateLimitOffset(limit, offset);
  return getBlocks(limit, offset, asc);
}

export async function ctrlGetLastBlock(): Promise<Block> {
  const block = await getLastBlock();
  if (!block) throw new ErrorBlockNotFound();
  return block;
}

export async function ctrlGetLowestHashes(
  limit: Limit,
  offset: Offset
): Promise<PaginatedResult<Block>> {
  await validateLimitOffset(limit, offset);
  return getLowestHashes(limit, offset);
}

export async function ctrlGetBlock(
  height?: string | number
): Promise<Block> {
  if (height === undefined) throw new ErrorMissingParameter("height");
  if (isNaN(height)) throw new ErrorInvalidParameter("height");

  const blockId = Math.max(
    typeof height === "string" ? parseInt(height) : height,
    0
  );

  const block = await getBlock(blockId);
  if (!block) throw new ErrorBlockNotFound();
  return block;
}

export async function ctrlSubmitBlock(
  req: Request,
  address?: string,
  rawNonce?: number[] | string,
  x?: number,
  y?: number,
  z?: number
): Promise<SubmitBlockResponse> {
  if (!await isMiningEnabled()) throw new ErrorMiningDisabled();

  if (!address) throw new ErrorMissingParameter("address");
  if (!isValidMistAddress(address, true))
    throw new ErrorInvalidParameter("address");

  if (!rawNonce) throw new ErrorMissingParameter("nonce");
  if (rawNonce.length < 1 || rawNonce.length > NONCE_MAX_SIZE)
    throw new ErrorInvalidParameter("nonce");

  if (!x) throw new ErrorMissingParameter("x");
  if (!y) throw new ErrorMissingParameter("y");
  if (!z) throw new ErrorMissingParameter("z");

  if (!Number.isInteger(x)) throw new ErrorInvalidParameter("x");
  if (!Number.isInteger(y)) throw new ErrorInvalidParameter("y");
  if (!Number.isInteger(z)) throw new ErrorInvalidParameter("z");

  return submitBlock(req, address, rawNonce, Math.floor(x), Math.floor(y), Math.floor(z));
}
