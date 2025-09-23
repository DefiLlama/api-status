import { promises as fs, watchFile, existsSync, writeFileSync } from 'fs';
import { PromisePool } from "@supercharge/promise-pool";
const { reImport, hashString, } = await import('./util.js')
let config = (await import('./config.js')).default;
const statusFile = './static/status.json';

watchFile('./config.js', async () => { // Dynamically reload config and watch it for changes.
	try {
		config = await reImport('./config.js');
		console.log('Reloaded config file.')
	} catch (e) {
		console.error(e);
	}
});

if (!existsSync(statusFile)) {
	writeFileSync(statusFile, JSON.stringify({}), 'utf8');
}


let hostLink

if (config.host) hostLink = `status page: ${config.host}`

const delay = async t => new Promise(r => setTimeout(r, t));
const handlize = s => s.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().replace(/\s+/g, '-');
const checkContent = async (content, criterion, negate = false) => {
	if (typeof criterion == 'string') {
		return content.includes(criterion) != negate;
	} else if (Array.isArray(criterion)) {
		return criterion[negate ? 'some' : 'every'](c => content.includes(c)) != negate;
	} else if (criterion instanceof RegExp) {
		return (!!content.match(criterion)) != negate;
	} else if (typeof criterion == 'function') {
		return (!!await Promise.resolve(criterion(content))) != negate;
	} else {
		throw new Error('Invalid content check criterion.')
	}
};


let lastNotificationSent = {}

const sendNotification = async ({ message, endpoint, discordWebhookUrl }) => {

	const sendDiscordMessage = async (text) => {
		if (hostLink) text += `\n\n${hostLink}`;
		await fetch(discordWebhookUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				content: text
			})
		});
	};

	const { id, sendNotificationEveryXMinutes = 60 } = endpoint


	if (!id) {
		console.error('No endpoint id provided, cannot send notification.')
		return;
	}

	if (lastNotificationSent[id]) {
		const lastSent = lastNotificationSent[id];
		const now = Date.now();
		const diffMinutes = Math.floor((now - lastSent) / 1000 / 60);
		if (diffMinutes < sendNotificationEveryXMinutes) {
			console.log(`Notification for ${id} already sent ${diffMinutes} minutes ago, skipping.`);
			return;
		}
	}

	lastNotificationSent[id] = Date.now();

	if (discordWebhookUrl)
		await sendDiscordMessage(message, discordWebhookUrl);
}

let status;
let isFirstRun = true;
while (true) {
	let verboseLog = config.verbose ? console.log : () => { }; // Use a custom log function to avoid console.log calls when not verbose
	verboseLog('🔄 Pulse');
	let startPulse = Date.now();
	try {
		try {
			if (!status)  // If status is not defined, we will try to read it from the file.
				status = JSON.parse((await fs.readFile(statusFile)).toString()); // We re-read the file each time in case it was manually modified.
		} catch (e) { console.error(`Could not find status.json file [${statusFile}], will create it.`) }
		status = status || {};
		status.sites = status.sites || {};
		status.config = {
			interval: config.interval,
			nDataPoints: config.nDataPoints,
			responseTimeGood: config.responseTimeGood,
			responseTimeWarning: config.responseTimeWarning,
		};

		status.ui = [];

		let siteIds = [];

		await Promise.all(config.sites.map(addSiteStatus))

		async function addSiteStatus(site) {
			verboseLog(`⏳ Site: ${site.name || site.id}`);
			const siteStartTime = Date.now();
			let siteId = site.id || handlize(site.name) || 'site';
			let i = 1; let siteId_ = siteId;
			while (siteIds.includes(siteId)) { siteId = siteId_ + '-' + (++i) } // Ensure a unique site id
			siteIds.push(siteId);

			status.sites[siteId] = status.sites[siteId] || {};
			let site_ = status.sites[siteId]; // shortcut ref
			site_.name = site.name || site_.name;
			site_.endpoints = site_.endpoints || {};

			let endpointIds = [];
			status.ui.push([siteId, endpointIds]);
			const endpoints = [...site.endpoints || []]; // Ensure endpoints is an array
			// randomize endpoints order
			endpoints.sort(() => Math.random() - 0.5);
			await PromisePool.withConcurrency(config.concurrency || 3) // Limit concurrency to avoid overwhelming the server
				.for(endpoints)
				.process(endpointHandler)


			async function endpointHandler(endpoint) {
				try {

					function getConfig(key, defaultValue) {
						if (endpoint.hasOwnProperty(key)) return endpoint[key]
						if (site.hasOwnProperty(key)) return site[key];
						if (config.hasOwnProperty(key)) return config[key];
						return defaultValue;
					}

					let endpointStatus = {
						t: Date.now(),// time
					};
					verboseLog(`\tFetching endpoint: ${endpoint.url}`);
					let endpointId = endpoint.id || handlize(endpoint.name) || 'endpoint';
					let i = 1; let endpointId_ = endpointId;
					while (endpointIds.includes(endpointId)) { endpointId = endpointId_ + '-' + (++i) } // Ensure a unique endpoint id
					endpointIds.push(endpointId);

					site_.endpoints[endpointId] = site_.endpoints[endpointId] || {};
					let endpoint_ = site_.endpoints[endpointId]; // shortcut ref
					endpoint_.name = endpoint.name || endpoint_.name;
					if (endpoint.link !== false)
						endpoint_.link = endpoint.link || endpoint.url;
					endpoint_.logs = endpoint_.logs || [];
					const lastLog = endpoint_.logs[endpoint_.logs.length - 1];
					const endpointConfig = {
						responseTimeGood: getConfig('responseTimeGood', 3000), // Default good response time is 3s
						responseTimeWarning: getConfig('responseTimeWarning', 60_000), // Default warning response time is 60s
						timeout: getConfig('timeout', 120_000), // Default timeout is 120 seconds
						consecutiveErrorsNotify: getConfig('consecutiveErrorsNotify', 3),
						consecutiveHighLatencyNotify: getConfig('consecutiveHighLatencyNotify', 5), // Default consecutive high latency notify is 5
						interval: getConfig('interval', 5), // Default interval is 5 minutes
						logsMaxDatapoints: getConfig('logsMaxDatapoints', 201),
						discordWebhookUrl: getConfig('discordWebhookUrl'),
						staleCheckInterval: getConfig('staleCheckInterval'), // How frequently (in minutes) to check for repeated stale data
					}

					// if it is not first run, we check if it was run recently and skip if it was
					if (!isFirstRun && lastLog?.t) {
						const intervalMS = (endpointConfig.interval - 2) * 60_000 // add 2 minutes to the interval as buffer
						const lastPulse = lastLog.t;
						if (endpointStatus.t - lastPulse < intervalMS) {
							// verboseLog(`\t⏱️ Skipping, last pulse was ${Math.floor((Date.now() - lastPulse) / 1000)} seconds ago.`);
							return; // Skip if the last pulse was less than the interval
						}
					}

					let start;

					try {
						performance.clearResourceTimings();
						start = performance.now();

						let response = { ok: true }
						let content = ''


						if (endpoint.url) {  // sometimes we have tests that dont use a URL/fetch the data but does custom checks
							response = await fetch(endpoint.url, {
								signal: AbortSignal.timeout(endpointConfig.timeout),
								...endpoint.request,
							});
							content = await response.text();
							await delay(0); // Ensures that the entry was registered.


							let perf = performance.getEntriesByType('resource').find(e => e.name.href === endpoint.url); // Find the entry for this request

							if (perf) {
								endpointStatus.dur = perf.responseEnd - perf.startTime; // total request duration
								endpointStatus.dns = perf.domainLookupEnd - perf.domainLookupStart; // DNS Lookup
								endpointStatus.tcp = perf.connectEnd - perf.connectStart; // TCP handshake time
								endpointStatus.ttfb = perf.responseStart - perf.requestStart; // time to first byte -> Latency
								endpointStatus.dll = perf.responseEnd - perf.responseStart; // time for content download
							} else { // backup in case entry was not registered
								endpointStatus.dur = performance.now() - start;
								endpointStatus.ttfb = endpointStatus.dur;
								verboseLog(`\tCould not use PerformanceResourceTiming API to measure request.`);
							}

							if (content.length) {
								// endpointStatus.contentLength = content.length;
								endpointStatus.contentHash = hashString(content);
							}

							// HTTP Status Check
							if (!endpoint.validStatus && !response.ok) {
								endpointStatus.err = `HTTP Status ${response.status}: ${response.statusText}`;
							} else if (endpoint.validStatus && ((Array.isArray(endpoint.validStatus) && !endpoint.validStatus.includes(response.status)) || (!Array.isArray(endpoint.validStatus) && endpoint.validStatus != response.status))) {
								endpointStatus.err = `HTTP Status ${response.status}: ${response.statusText}`;
							}

							// Content checks
							if (!endpointStatus.err && endpoint.mustFind && !await checkContent(content, endpoint.mustFind)) {
								endpointStatus.err = '"mustFind" check failed';
							}
							if (!endpointStatus.err && endpoint.mustNotFind && !await checkContent(content, endpoint.mustNotFind, true)) {
								endpointStatus.err = '"mustNotFind" check failed';
							}

						} else if (typeof endpoint.customCheck !== 'function')
							throw new Error('No URL or customCheck function was provided for this test');

						if (!endpointStatus.err && endpoint.customCheck && typeof endpoint.customCheck == 'function') {
							let jsonContent
							try {
								if (content.length)
									jsonContent = JSON.parse(content);
							} catch (e) { }
							const checkResult = await endpoint.customCheck({ content, response, jsonContent, endpoint, site, endpointStatus, logs: endpoint_.logs });

							if (!endpoint.url) {
								endpointStatus.dur = performance.now() - start;
								endpointStatus.ttfb = endpointStatus.dur;
							}

							if (!checkResult) {
								endpointStatus.err = '"customCheck" check failed';
							}
						}


						// Stale response check, check if enabled, check if there are logs with the same contentHash (if that is missing, it means the content has changed)
						if (!endpointStatus.err && endpointConfig.staleCheckInterval && endpointStatus.contentHash && !endpointStatus.err) {
							const logsWithSameHash = endpoint_.logs.filter(log => log.contentHash === endpointStatus.contentHash);

							if (logsWithSameHash.length) {
								const firstLogWithSameHash = logsWithSameHash[0]
								if (firstLogWithSameHash.t && (Date.now() - firstLogWithSameHash.t) > endpointConfig.staleCheckInterval * 60_000) {
									endpointStatus.err = `Stale response, contentHash is ${endpointStatus.contentHash} same response for the past ${Number((Date.now() - firstLogWithSameHash.t) / (60_000 * 60)).toFixed(2)} hours`;
									console.log(`[ERROR]`, endpointStatus.err)
								}
							}
						}


					} catch (e) {
						endpointStatus.err = String(e);
						if (!endpointStatus.dur) {
							endpointStatus.dur = performance.now() - start;
							endpointStatus.ttfb = endpointStatus.dur;
						}
					} finally {
						endpoint_.logs.push(endpointStatus);
						if (endpoint_.logs.length > endpointConfig.logsMaxDatapoints) // Remove old datapoints
							endpoint_.logs.splice(0, endpoint_.logs.length - endpointConfig.logsMaxDatapoints);
						if (endpointStatus.err) {
							endpoint.consecutiveErrors = (endpoint.consecutiveErrors || 0) + 1;
							endpoint.consecutiveHighLatency = 0;
							verboseLog(`\t🔥 ${site.name || siteId} — ${endpoint.name || endpointId} [${endpointStatus.ttfb.toFixed(2)}ms]`);
							verboseLog(`\t→ ${endpointStatus.err}`);
							try {
								if (endpoint.consecutiveErrors >= endpointConfig.consecutiveErrorsNotify) {
									const message = `🔥 ERROR\n` +
										`${site.name || siteId} — ${endpoint.name || endpointId} [${endpointStatus.ttfb.toFixed(2)}ms]\n` +
										`→ ${endpointStatus.err}` +
										(endpoint.link !== false ? `\n→ ${endpoint.link || endpoint.url}` : '');
									sendNotification({ message, endpoint, discordWebhookUrl: endpointConfig.discordWebhookUrl });
								}
							} catch (e) { console.error(e); }
						} else {
							endpoint.consecutiveErrors = 0;
							let emoji = '🟢';
							if (endpointStatus.ttfb > endpointConfig.responseTimeWarning) {
								emoji = '🟥';
								endpoint.consecutiveHighLatency = (endpoint.consecutiveHighLatency || 0) + 1;
							} else {
								endpoint.consecutiveHighLatency = 0;
								if (endpointStatus.ttfb > endpointConfig.responseTimeGood)
									emoji = '🔶';
							}
							verboseLog(`\t${emoji} ${site.name || siteId} — ${endpoint.name || endpointId} [${endpointStatus?.ttfb?.toFixed(2)}ms]`);
							try {
								if (endpoint.consecutiveHighLatency >= endpointConfig.consecutiveHighLatencyNotify) {
									const message = `🟥 High Latency\n` +
										`${site.name || siteId} — ${endpoint.name || endpointId} [${endpointStatus.ttfb.toFixed(2)}ms]\n` +
										(endpoint.link !== false ? `\n→ ${endpoint.link || endpoint.url}` : '');
									sendNotification({ message, endpoint, discordWebhookUrl: endpointConfig.discordWebhookUrl });
								}
							} catch (e) { console.error(e); }
						}
					}
				} catch (e) {
					console.error(e);
				}
			}
			verboseLog(' ');//New line
			console.log(`\t⏱️ Site ${site.name || siteId} took ${Number((Date.now() - siteStartTime) / 1000).toFixed(2)} seconds to process.`);
		}
		status.lastPulse = Date.now();
		await fs.writeFile(statusFile, JSON.stringify(status, undefined, config.readableStatusJson ? 2 : undefined));
	} catch (e) {
		console.error(e);
	}
	verboseLog('✅ Done');
	await delay(config.interval * 60_000 - (Date.now() - startPulse));
	isFirstRun = false;
}
