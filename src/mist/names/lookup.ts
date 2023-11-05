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

import { Limit, Offset, Name, PaginatedResult, db } from "../../database";
import { InferAttributes, Op } from "sequelize";

import { sanitiseLimit, sanitiseOffset } from "../../utils";

export async function lookupNames(
  addressList: string[] | undefined,
  limit: Limit,
  offset: Offset,
  orderBy: (keyof InferAttributes<Name>) | "transferredOrRegistered" = "name",
  order: "ASC" | "DESC" = "ASC"
): Promise<PaginatedResult<Name>> {
  return Name.findAndCountAll({
    order: [[
      // Ordering by `transferred` can return null results and may not be the
      // desireable ordering for the user, so `transferredOrRegistered` is an
      // alternative option that falls back to `registered` if `transferred` is
      // null.
      orderBy === "transferredOrRegistered"
        ? db.fn("COALESCE", db.col("transferred"), db.col("registered"))
        : orderBy,
      order
    ]],
    limit: sanitiseLimit(limit),
    offset: sanitiseOffset(offset),
    where: addressList ? { owner: {[Op.in]: addressList} } : undefined,
  });
}
