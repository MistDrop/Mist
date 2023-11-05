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

import { Address, db } from "../../database";
import { QueryTypes } from "sequelize";

export async function lookupAddresses(
  addressList: string[],
  fetchNames?: boolean
): Promise<Address[]> {
  if (fetchNames) {
    return db.query(`
      SELECT
        \`addresses\`.*,
        COUNT(\`names\`.\`id\`) AS \`names\`
      FROM \`addresses\`
      LEFT JOIN \`names\` ON \`addresses\`.\`address\` = \`names\`.\`owner\`
      WHERE \`addresses\`.\`address\` IN (:addresses)
      GROUP BY \`addresses\`.\`address\`
      ORDER BY \`names\` DESC
    `, {
      replacements: { addresses: addressList },
      type: QueryTypes.SELECT
    });
  } else {
    return Address.findAll({ where: { address: addressList } });
  }
}
