import got from 'got';
import type { Context } from '../../extends/context';

import type { CommandFunc } from '../../types';

import { Util } from '../../objects';

const npmCommand: CommandFunc = async (ctx: Context) => {
	try {
		const query = ctx.args[0];
		if (!query) {
			await ctx.reply('Please specify a package name!');
			return;
		}
		const response = await got.get(
			'https://registry.npmjs.org/' + encodeURIComponent(query),
		);

		const json = JSON.parse(response.body);

		// npm package infos
		const dependencies = json['versions'][json['dist-tags']['latest']][
			'dependencies'
		]
			? Object.keys(
					json['versions'][json['dist-tags']['latest']][
						'dependencies'
					],
			  )
			: [];

		const maintainers = json['maintainers'].map(
			(u: Record<string, string>) => u.name,
		);

		// send it
		await ctx.reply(
			`Package: *${json['name']}* - v${json['dist-tags']['latest']}\n${
				json['description'] ?? 'No Description.'
			}\n\nLicense: ${
				json['license'] || 'None.'
			}\nLast modify: ${new Date(json.time.modified)}\nAuthor: ${
				json['author'] ? json['author']['name'] : 'Unknown.'
			}\nDependencies: ${
				dependencies.length
					? dependencies.length > 15
						? Util.trimArray(dependencies).join(', ')
						: dependencies.join(', ')
					: '-'
			}\nMaintainers: ${
				maintainers.length > 15
					? Util.trimArray(maintainers).join(',')
					: maintainers.join(', ')
			}`,
		);
	} catch (err) {
		await ctx.reply('An error occured: ' + err);
	}
};

export default Util.makeCommandConfig({
	'name': 'npm',
	'desc': 'Show NPM package information',
	'alias': ['node-package-manager', 'nodepackagemanager'],
	'target': npmCommand,
});
