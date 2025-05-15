
let env = (await import('./env.js')).default;
import axios from 'axios';
const dummyURL = `${env.tvl_api2_base}/hash`

export default {
  host: env.host,
  interval: 5, // Interval in minutes between each pulse
  nDataPoints: 90, // Number of datapoints to display on the dashboard
  responseTimeGood: 3000, // In milliseconds, this and below will be green
  responseTimeWarning: 60000, // In milliseconds, above this will be red
  timeout: 1200000, // In milliseconds, requests will be aborted above this
  verbose: false, // Whether or not to output pulse messages in the console
  readableStatusJson: false, // Format status.json to be human readable
  logsMaxDatapoints: 200, // Maximum datapoints history to keep (per endpoint)
  discord: { // optional, tokens to send notifications through discord
    webhookUrl: env.defaultWebhookUrl,
  },
  consecutiveErrorsNotify: 2, // After how many consecutive Errors events should we send a notification
  consecutiveHighLatencyNotify: 5, // After how many consecutive High latency events should we send a notification
  sites: [ // List of sites to monitor
    {
      id: 'llama-api', // optional
      name: 'Llama Internal API',
      endpoints: [ // Each site is a bunch of endpoints that can be tested
        /* {
          id: 'tvl-api2-test', // mandatory for sending notifications
          name: 'test',
          // discordWebhookUrl: '...', // optional
          link: false, // optional, for notifications and dashboard only, [defaults to endpoint.url], can be disabled by setting it to false
          url: dummyURL, // required
          sendNotificationEveryXMinutes: 60, // optional, send notification every X minutes defaults to 60
          customCheck: async (content, response) => {
            return false
          }, // optional, Function | AsyncFunction -> Run your own custom checks return false in case of errors
        }, */
        {
          id: 'tvl-api2-hash', // mandatory for sending notifications
          name: 'Tvl api2 base',
          link: false,
          url: `${env.tvl_api2_base}/hash`, // required
          sendNotificationEveryXMinutes: 60, // optional, send notification every X minutes defaults to 60
        },
        {
          id: 'dimensions-api2-hash',
          name: 'Dimensions api2 base',
          link: false,
          url: `${env.dimensions_api2_base}/hash`,
        },
        {
          id: 'dimensions-internal-api-options',
          name: 'Options overview',
          link: false,
          url: `${env.dimensions_api2_base}/${env.api2Subpath}/overview/options?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`,
        },
      ]
    },

    getIndexerApi(),
    getDimensionsApi(),
  ],
};


function getDimensionsApi() {
  const defaultOptions = `excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`
  return {
    id: 'dimensions-api',
    name: 'Dimensions API',
    endpoints: [
      {
        id: 'dimensions-api-options',
        name: 'Options overview',
        url: `${env.apiBase}/overview/options?${defaultOptions}`,
      },
      {
        id: 'dimensions-api-derivatives',
        name: 'Derivatives overview',
        url: `${env.apiBase}/overview/derivatives?${defaultOptions}`,
      },
      {
        id: 'dimensions-api-Dexs',
        name: 'Dexs overview',
        url: `${env.apiBase}/overview/dexs?${defaultOptions}`,
      },
      {
        id: 'dimensions-api-fees',
        name: 'Fees overview',
        url: `${env.apiBase}/overview/fees?${defaultOptions}`,
      },
      {
        id: 'dimensions-api-aggregators',
        name: 'Aggregators overview',
        url: `${env.apiBase}/overview/aggregators?${defaultOptions}`,
      },
      {
        id: 'dimensions-api-aggregators',
        name: 'Aggregators overview',
        url: `${env.apiBase}/overview/aggregators?${defaultOptions}`,
      },
      {
        id: 'dimensions-api-bridge-aggregators',
        name: 'Bridge aggregators overview',
        url: `${env.apiBase}/overview/bridge-aggregators?${defaultOptions}`,
      },
      {
        id: 'dimensions-api-aggregator-derivatives',
        name: 'Derivatives aggregators overview',
        url: `${env.apiBase}/overview/aggregator-derivatives?${defaultOptions}`,
      },
    ],
  }
}

function getIndexerApi() {
  return {
    id: 'indexer-api',
    name: 'Llama Indexer API',
    endpoints: [
      {
        id: 'indexer-api-sync',
        name: 'Indexer API sync',
        link: false,
        url: dummyURL,
        customCheck: async () => {
          // Check if the indexer is synced
          try {
            const { data } = await axios.get(`${env.indexerBase}/sync`, {
              headers: {
                'x-api-key': env.indexerApiKey,
              },
            });

            return !!data.syncStatus
          } catch (error) {
            console.error('Error fetching indexer sync status:', error);
            return false;
          }
        },
      },
    ],
  }
}