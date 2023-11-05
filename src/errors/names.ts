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

export class ErrorNameNotFound extends MistError<{ name?: string | null }> {
  constructor(name: string) {
    super(
      `Name ${name ?? "[null]"} not found`,
      "name_not_found",
      404,
      { name }
    );
  }
}

export class ErrorNameTaken extends MistError<{ name?: string | null }> {
  constructor(name: string) {
    super(
      `Name ${name ?? "[null]"} is already taken`,
      "name_taken",
      409,
      { name }
    );
  }
}

export class ErrorNotNameOwner extends MistError<{ name?: string | null }> {
  constructor(name: string) {
    super(
      `You are not the owner of name ${name ?? "[null]"}`,
      "not_name_owner",
      403,
      { name }
    );
  }
}
