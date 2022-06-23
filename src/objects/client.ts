import * as path from 'node:path';
import baileys, { UserFacingSocketConfig } from '@adiwajshing/baileys';
import { createLogger } from './logger';
import { Modules } from './module';
import { MessageCollector } from '../extends/collector';
import { GroupContext } from '../extends/group';
import { Readable } from 'stream';
import { RSA } from '../rsa';

/**
 * @class Client
 */
export class Client {
	/**
	 * Client constructor.
	 * @param {UserFacingSocketConfig} _options - Baileys socket configuration.
	 */
	constructor(private _options: UserFacingSocketConfig) {}

	public logger = createLogger('client');
	public baileys = baileys({
		...this._options,
		logger: this.logger,
	});
	public modules = new Modules(
		this,
		path.resolve(__dirname, '..', 'commands'),
		path.resolve(__dirname, '..', 'listeners'),
	);
	public rsa = new RSA();
	public startTime = Date.now();
	public collectors: Map<string, MessageCollector> = new Map();

	public groupsCache: Map<string, GroupContext> = new Map();
	public youtubeStreams: Map<string, Readable> = new Map();
}
