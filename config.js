
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
      id: 'internal-api', // optional
      name: 'Internal API',
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

    getPublicSites(),
    getIndexerApi(),
    getDimensionsApi(),
    getStablecoinApi(),
    getTvlApi(),
    getCoinsApi(),
    getYieldApi(),
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
    name: 'Indexer API',
    endpoints: [
      {
        id: 'indexer-api-sync',
        name: 'Indexer API sync',
        link: false,
        url: dummyURL,
        customCheck: async () => {
          const payload = { headers: { 'x-api-key': env.indexerApiKey } };
          const { data } = await axios.get(`${env.indexerBase}/sync`, payload);
          return !!data.syncStatus
        },
      },
      {
        id: 'indexer-api-balances',
        name: 'Indexer API Balances',
        link: false,
        url: dummyURL,
        customCheck: async () => {
          const payload = {
            headers: { 'x-api-key': env.indexerApiKey },
            params: {
              addresses: '0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50',
            },
          };
          const { data } = await axios.get(`${env.indexerBase}/balances`, payload);
          return !!data.balances
        },
      },
      {
        id: 'indexer-api-logs',
        name: 'Indexer API Logs',
        link: false,
        url: dummyURL,
        customCheck: async () => {
          const payload = {
            headers: { 'x-api-key': env.indexerApiKey },
            params: {
              addresses: '0xbb2b8038a1640196fbe3e38816f3e67cba72d940,0xdfc14d2af169b0d36c4eff567ada9b2e0cae044f',
              chainId: 1,
              topic0: '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822',
              from_block: 22018452,
              to_block: 22019085,
              limit: 10
            },
          };
          const { data } = await axios.get(`${env.indexerBase}/logs`, payload);
          return !!data.logs
        },
      },
    ],
  }
}

function getStablecoinApi() {
  return {
    id: 'stablecoin-api',
    name: 'Stablecoin API',
    endpoints: [
      {
        id: 'stablecoin-api-config',
        name: 'Config',
        link: false,
        url: `${env.stablecoinBase}/config`,
      },
      {
        id: 'stablecoin-api-stablecoin',
        name: 'Stablecoin data',
        link: false,
        url: `${env.stablecoinBase}/stablecoin/23`,
      },
      {
        id: 'stablecoin-api-dominance',
        name: 'Chain dominance',
        link: false,
        url: `${env.stablecoinBase}/stablecoindominance/ethereum`,
      },
    ],
  }
}

function getTvlApi() {
  return {
    id: 'tvl-api',
    name: 'Tvl API',
    endpoints: [
      {
        id: 'tvl-api-protocols',
        name: 'Protocols',
        url: `${env.apiBase}/protocols`,
      },
      {
        id: 'tvl-api-protocol-tvl',
        name: 'Protocol TVL',
        url: `${env.apiBase}/tvl/uniswap`,
      },
    ],
  }
}

function getCoinsApi() {
  return {
    id: 'coins-api',
    name: 'Coins API',
    endpoints: [
      {
        id: 'coins-api-protocols',
        name: 'Get token price',
        url: `${env.coinsBase}/prices/current/coingecko:ethereum,coingecko:tether,ethereum:0x0000000000000000000000000000000000000000`,
        customCheck: async (content) => {
          const { coins } = JSON.parse(content);
          const status = !['coingecko:ethereum', 'coingecko:tether', 'ethereum:0x0000000000000000000000000000000000000000'].some((coin) => !coins[coin]?.price)
          return status
        },
      },
    ],
  }
}

function getYieldApi() {
  return {
    id: 'yield-api',
    name: 'Yield API',
    endpoints: [
      {
        id: 'yield-api-protocols',
        name: 'Pools',
        url: `https://yields.llama.fi/pools`,
      },
      {
        id: 'yield-api-protocol-chart',
        name: 'Pool chart',
        link: false,
        url: `${env.yieldInternalBase}/chart/747c1d2a-c668-4682-b9f9-296708a3dd90`,
      },
    ],
  }
}

function getPublicSites() {
  return {
    id: 'public',
    name: 'Public sites',
    endpoints: [
      {
        id: 'chainlist-site',
        name: 'Chainlist home',
        url: `https://chainlist.org`,
      },
      {
        id: 'chainlist-rpc-list',
        name: 'Chainlist RPC list',
        url: `https://chainlist.org/rpcs.json`,
      },
    ],
  }
}