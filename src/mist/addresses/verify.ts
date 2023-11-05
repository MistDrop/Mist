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

import chalk from "chalk";
import { Request } from "express";

import { Address } from "../../database";
import { getAddress } from ".";
import { logAuth } from "../authLog";

import { getLogDetails, makeV2Address, sha256 } from "../../utils";

import promClient from "prom-client";
import { criticalLog } from "../../utils/criticalLog";

const promAddressesVerifiedCounter = new promClient.Counter({
  name: "mist_addresses_verified_total",
  help: "Total number of addresses verified since the Mist server started.",
  labelNames: ["type"]
});

promAddressesVerifiedCounter.inc({ type: "attempt" }, 0);
promAddressesVerifiedCounter.inc({ type: "failed" }, 0);
promAddressesVerifiedCounter.inc({ type: "authed" }, 0);

export interface VerifyResponse {
  authed: boolean;
  address: Address;
}

export async function verifyAddress(
  req: Request,
  privatekey: string
): Promise<VerifyResponse> {
  const { path, logDetails } = getLogDetails(req);

  const mistAddress = makeV2Address(privatekey);

  console.log(chalk`{cyan [Auth]} ({bold ${path}}) Auth attempt on address {bold ${mistAddress}} ${logDetails}`);
  promAddressesVerifiedCounter.inc({ type: "attempt" });

  const hash = sha256(mistAddress + privatekey);
  const address = await getAddress(mistAddress);
  if (!address) { // Unseen address, create it
    const newAddress = await Address.create({
      address: mistAddress,
      firstseen: new Date(),
      balance: 0, totalin: 0, totalout: 0,
      privatekey: hash
    });

    logAuth(req, mistAddress, "auth");
    promAddressesVerifiedCounter.inc({ type: "authed" });
    return { authed: true, address: newAddress };
  }

  if (address.privatekey) { // Address exists, auth if the privatekey is equal
    const authed = !address.locked && address.privatekey === hash;

    if (authed) {
      logAuth(req, mistAddress, "auth");
    } else {
      const reason = address.locked
        ? `(locked, alert: ${address.alert ?? "none"})`
        : "(incorrect privatekey hash)";
      console.log(chalk`{red [Auth]} ({bold ${path}}) Auth failed on address `
        + chalk`{bold ${mistAddress}} for reason {bold ${reason}} `
        + chalk`${logDetails}`);
      criticalLog(req, `Auth failed on address **${mistAddress}**. Reason: `
        + reason, false);
    }

    promAddressesVerifiedCounter.inc({ type: authed ? "authed" : "failed" });
    return { authed, address };
  } else { // Address doesn't yet have a privatekey, claim it as the first
    const updatedAddress = await address.update({ privatekey: hash });

    logAuth(req, mistAddress, "auth");
    promAddressesVerifiedCounter.inc({ type: "authed" });
    return { authed: true, address: updatedAddress };
  }
}
