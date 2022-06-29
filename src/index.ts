import 'dotenv/config';

import { resolve as resolvePath } from 'node:path';
import { unlinkSync, existsSync } from 'node:fs';
import type { Boom } from '@hapi/boom';

import * as qr from 'qrcode';
import {
	DisconnectReason,
	AuthenticationState,
} from '@adiwajshing/baileys';
import { Client } from './objects';
import { useAuthStateFile } from './authState';

/**
 * Init baileys connection
 *
 * @return {Promise<void>}
 */
async function initSock(): Promise<void> {
	try {
		const { state, saveState } = await useAuthStateFile(
			resolvePath(__dirname, '..', 'auth.json.enc'),
		);

		const client = new Client({
			'auth': state as AuthenticationState,
		});

		client.baileys.ev.on('connection.update', (conn) => {
			if (conn.qr) {
				client.logger.info('QR Generated');
				qr.toFile(resolvePath(__dirname, '..', 'qr.png'), conn.qr);
			} else if (conn.connection && conn.connection === 'close') {
				if (
					(conn.lastDisconnect?.error as Boom).output.statusCode !==
					DisconnectReason.loggedOut
				) {
					client.logger.info('Trying to reconnect');
					client.modules.free();
					for (const listener of client.modules.listens) {
						client.baileys.ev.removeAllListeners(
							listener,
						);
					}
					initSock();
				}
				if (existsSync(resolvePath(__dirname, '..', 'qr.png'))) {
					unlinkSync(resolvePath(__dirname, '..', 'qr.png'));
				}
			} else if (conn.connection && conn.connection === 'open') {
				client.logger.info('WebSocket opened');
			}
		});

		client.baileys.ev.on('creds.update', () => {
			saveState().catch((err) => {
				client.logger.warn(
					'Fail to save credentials, reason:',
					err.message,
				);
			});
		});

		// start the module
		client.modules.loads();
		client.modules.loadEvents();
	} catch (err) {
		if (err instanceof Error) {
			console.error(err.message);
			process.exit(1);
		}
	}
}

process.setMaxListeners(20);
initSock();
