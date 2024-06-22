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

import { QueryTypes, sql } from "@sequelize/core";
import { Address, db } from "../../database/index.js";
import { AddressWithNames } from "./index.js";

export async function lookupAddresses(
  addressList: string[],
  fetchNames?: boolean
): Promise<Address[]> {
  if (fetchNames) {
    const rows: AddressWithNames[] = await db.query(sql`
      SELECT
        \`addresses\`.*,
        COUNT(\`names\`.\`id\`) AS \`names\`
      FROM \`addresses\`
      LEFT JOIN \`names\` ON \`addresses\`.\`address\` = \`names\`.\`owner\`
      WHERE \`addresses\`.\`address\` IN :addresses
      GROUP BY \`addresses\`.\`address\`
      ORDER BY \`names\` DESC
    `, {
      replacements: { addresses: sql.list(addressList) },
      type: QueryTypes.SELECT
    });

    return rows.map(row => {
      row.firstseen = new Date(row.firstseen);
      row.names = Number(row.names);
      return row;
    });
  } else {
    return Address.findAll({ where: { address: addressList } });
  }
}
