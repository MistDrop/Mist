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
import { Router } from "express";

import { ws as wsInstance } from "..";
import { wsManager } from "../../websockets";
import { promWebsocketConnectionsTotal } from "../../websockets/prometheus";

import { verifyAddress } from "../../mist/addresses/verify";

import { ErrorAuthFailed, errorToJson } from "../../errors";
import { getLogDetails } from "../../utils";
import { FORCE_INSECURE, PUBLIC_WS_URL } from "../../utils/constants";

/**
 * @apiDefine WebsocketGroup Websockets
 *
 * All Websocket related endpoints.
 */
export default (): Router => {
  const router = Router();
  wsInstance.applyTo(router);

  // Primary websocket connection handler - handles token verification
  router.ws("/ws/gateway/:token", async (ws, req) => {
    const { token } = req.params;
    const { logDetails } = getLogDetails(req);

    promWebsocketConnectionsTotal.inc({ type: "incomplete" });

    try {
      // Look up the token, will reject if the token does not exist
      const { address, privatekey } = wsManager.useToken(token);

      // Wrap and add the socket to the manager, which will handle the rest
      console.log(chalk`{cyan [Websockets]} Incoming connection for {bold ${address}} ${logDetails}`);
      wsManager.addWebsocket(req, ws, token, address, privatekey);
    } catch (err) {
      console.log(chalk`{red [Websockets]} Failed connection using token {bold ${token}} ${logDetails}`);
      console.error(err);

      if (ws.readyState === ws.OPEN) {
        // Manually send the error here - websocket may not be wrapped
        ws.send(JSON.stringify({
          ...errorToJson(err),
          type: "error"
        }));
        ws.close();
      } else {
        // Remove the websocket from the manager just in case
        wsManager.removeWebsocket(token);
      }
    }
  });

  /**
   * @api {post} /ws/start Initiate a websocket connection
   * @apiName WebsocketStart
   * @apiGroup WebsocketGroup
   * @apiVersion 2.0.0
   *
   * @apiDescription ## Connecting to the Websocket server
   *
   * To initiate a websocket connection, you must first make a POST request to
   * `/ws/start`. The response will contain a `url` parameter (of the form
   * `wss://ws.mist.dev/ws/gateway/ba90ad70-cdfa-11e5-8cca-e1d2a26eabaf`) that
   * can be used to connect to the websocket. This URL will expire after 30
   * seconds. You will have to connect to the supplied URL within that time
   * frame.
   *
   * There are two types of websockets:
   *
   * * Guest Sessions
   * * Authed Sessions
   *
   * A **guest session** is a session without a privatekey. It has access to
   * basic API calls such as `address`.
   *
   * An **authed session** is a session linked to an address. The privatekey is
   * supplied as a POST body parameter during `/ws/start`. It has access to most
   * API calls, including transactions and name registration. **Authed
   * websockets only work with v2 addresses.**
   *
   * You can also upgrade from a guest session to an authed session using the
   * method `upgrade`. See the websocket documentation for further information.
   *
   * ## Requests and responses
   *
   * The websockets follow a specific request-response subprotocol. Messages
   * sent to a websocket must always be in a valid JSON format (either
   * prettified or minified, it does not matter), and must supply an `id` and
   * `type` parameter.
   *
   * `id` should be a unique, automatically incrementing integer. When the
   * server responds to you message, it will respond back with the same ID. This
   * is so that you know which messages the server is responding to.
   *
   * `type` must be any valid message type specified in the documentation below.
   *
   * ## Keep-alive
   *
   * Every 10 seconds, the server will broadcast a keep-alive event with the
   * type `keepalive` to all clients. This is simply to maintain connections
   * from clients which automatically close the socket after inactivity. Your
   * client does not need to interpret these events in any way, and can
   * completely disregard them.
   *
   * ## Subscription Levels
   *
   * There are several subscription levels for events that are broadcasted to
   * all clients. When you are subscribed to an event you will automatically
   * receive a message with the type `event` in a format similar to the
   * following:
   *
   * ```json
   *   {
   *     "ok": "true",
   *     "type": "event",
   *     "event": "transaction",
   *     "transaction": { ... }
   *   }
   * ```
   *
   * You can unsubscribe and subscribe to certain events to only receive what
   * you wish to.
   *
   * ### Subscription Levels & Event List
   *
   * | Subscription Name | Events        | Description                                                                               |
   * | ----------------- | ------------- | ----------------------------------------------------------------------------------------- |
   * | `transactions`    | `transaction` | Transaction events whenever a transaction is made by anybody on the node.                 |
   * | `ownTransactions` | `transaction` | Transaction events whenever a transaction is made to or from the authed user.             |
   * | `names`           | `name`        | Name events whenever a name is purchased, modified or transferred by anybody on the node. |
   * | `ownNames`        | `name`        | Name events whenever the authed user purchases, modifies or transfers a name.             |
   *
   * ## Examples
   *
   * @apiBody {String} [privatekey] The privatekey to authenticate with.
   *
   * @apiSuccess {String} url The address to connect to
   *
   * @apiSuccessExample {json} Success
   * {
   *     "ok": true,
   *     "url": "wss://ws.mist.dev/ws/gateway/ba90ad70-cdfa-11e5-8cca-e1d2a26eabaf",
   *     "expires": 30
   * }
   */
  router.post("/ws/start", async (req, res) => {
    const { privatekey } = req.body;

    const publicUrl = PUBLIC_WS_URL;
    const scheme = publicUrl.startsWith("localhost:")
      || FORCE_INSECURE ? "ws" : "wss";
    const urlBase = `${scheme}://${publicUrl}/ws/gateway/`;

    if (privatekey) { // Auth as address if privatekey provided
      const { authed, address } = await verifyAddress(req, privatekey);
      if (!authed) throw new ErrorAuthFailed();

      const token = await wsManager.obtainToken(address.address, privatekey);

      res.json({
        ok: true,
        url: urlBase + token,
        expires: 30
      });
    } else { // Auth as guest if no privatekey provided
      const token = await wsManager.obtainToken("guest");

      res.json({
        ok: true,
        url: urlBase + token,
        expires: 30
      });
    }
  });

  return router;
};
