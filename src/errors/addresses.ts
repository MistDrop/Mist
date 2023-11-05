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

import { MistError } from "./MistError";

export class ErrorAddressNotFound extends MistError<{ address?: string | null }> {
  constructor(address: string) {
    super(
      `Address ${address ?? "[null]"} not found`,
      "address_not_found",
      404,
      { address }
    );
  }
}

export class ErrorAuthFailed extends MistError<never> {
  constructor() {
    super("Authentication failed", "auth_failed", 401);
  }
}
