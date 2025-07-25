
import axios from 'axios';
const { reImport, hashString } = await import('./util.js')
let env = await reImport('./env.js')

const createIndexerClient = (apiKey, baseURL) => axios.create({
  headers: { "x-api-key": apiKey },
  baseURL,
})

const axiosIndexerV2 = createIndexerClient(env.indexerApiKeyV2, env.indexerBaseV2)
const axiosIndexerV1 = createIndexerClient(env.indexerApiKey, env.indexerBase)

const ONE_MINUTE = 1 // everything is in minutes
const ONE_HOUR = 60 * ONE_MINUTE
const ONE_DAY = ONE_HOUR * 24


export const config = {
  host: env.host,
  interval: 5, // Interval in minutes between each pulse
  nDataPoints: 90, // Number of datapoints to display on the dashboard
  responseTimeGood: 3000, // In milliseconds, this and below will be green
  responseTimeWarning: 60000, // In milliseconds, above this will be red
  timeout: 120000, // In milliseconds, requests will be aborted above this
  verbose: false, // Whether or not to output pulse messages in the console
  readableStatusJson: false, // Format status.json to be human readable
  logsMaxDatapoints: 200, // Maximum datapoints history to keep (per endpoint)
  discordWebhookUrl: env.defaultWebhookUrl, //  to send notifications through discord
  consecutiveErrorsNotify: 3, // After how many consecutive Errors events should we send a notification
  consecutiveHighLatencyNotify: 5, // After how many consecutive High latency events should we send a notification
  staleCheckInterval: ONE_DAY * 1.3,
  sites: [ // List of sites to monitor
    {
      id: 'test-api', // optional
      name: 'Sample API',
      endpoints: [ // Each site is a bunch of endpoints that can be tested
        /* {
          id: 'tvl-api2-test', //optional
          name: 'test',
          staleCheckInterval: 2*60, // How frequently (in minutes) to check for repeated stale data
          // discordWebhookUrl: '...', // optional
          url: 'https://api.llama.fi/tvl', // optional
          link: false, // optional, for notifications and dashboard only, [defaults to endpoint.url], can be disabled by setting it to false
          sendNotificationEveryXMinutes: 60, // optional, send notification every X minutes defaults to 60
          customCheck: async ({content, response, jsonResponse, endpoint }) => {
            return false
          }, // optional, Function | AsyncFunction -> Run your own custom checks return false in case of errors
        }, */
      ]
    },

    getInternalApi(),
    getPublicSites(),
    getIndexerApi(),
    getIndexerApiV2(),
    getDimensionsApi(),
    getStablecoinApi(),
    getTvlApi(),
    getCoinsApi(),
    getYieldApi(),
    getRpcAggWorkerEndpoints(),
    getProApi(),
  ].filter(i => !!i && i.endpoints.length), // Filter out empty sites
};

config.sites.forEach(site => {
  const { endpoints = [] } = site
  if (!site.id) site.id = site.name ? site.name.toLowerCase().replace(/\s+/g, '-') : 'site';
  if (!site.name) site.name = site.id.charAt(0).toUpperCase() + site.id.slice(1);
  endpoints.forEach(endpoint => {
    if (!endpoint.id) endpoint.id = endpoint.name ? endpoint.name.toLowerCase().replace(/\s+/g, '-') : 'endpoint';
    if (!endpoint.name) endpoint.name = endpoint.id.charAt(0).toUpperCase() + endpoint.id.slice(1);
  })
})

export default config

function getInternalApi() {
  if (!env.tvl_api2_base || !env.dimensions_api2_base || !env.api2Subpath) {
    return null
  }

  const api2Routes = [
    { name: 'protocol', subPath: '/protocol/aave-v2' },
    { name: 'simpleChainDataset', subPath: '/simpleChainDataset/ethereum' },
    { name: 'simpleChainDataset1', subPath: '/simpleChainDataset/arbitrum' },
    { name: 'treasury', subPath: '/treasury/aave' },
    { name: 'updatedProtocol', subPath: '/updatedProtocol/aave' },


    { name: 'protocols', subPath: "/protocols", },
    { name: 'config', subPath: "/config", },
    { name: 'charts', subPath: "/lite/charts/arbitrum", },
    { name: 'charts1', subPath: "/lite/charts/solana", },

    { name: 'treasuries', subPath: "/treasuries", },
    { name: 'entities', subPath: "/entities", },
    { name: 'chains', subPath: '/chains', },
    { name: 'chains-v2', subPath: '/v2/chains', },
    { name: 'tvl', subPath: "/tvl/sky", },
    { name: 'config smol', subPath: "/config/smol/jito", },
    { name: 'raises', subPath: "/raises", },
    { name: 'hacks', subPath: "/hacks", },
    { name: 'oracles', subPath: "/oracles", },
    { name: 'forks', subPath: "/forks", },
    { name: 'categories', subPath: "/categories", },
    { name: 'langs', subPath: "/langs", },
    { name: 'chart categories', subPath: "/lite/charts/categories/lending", },


    { name: 'dataset', subPath: "/dataset/sky-lending", },


    { name: 'lite-protocols', subPath: "/lite/protocols2", },
    { name: 'lite-v2', subPath: "/lite/v2/protocols", },
    { name: 'chains2', subPath: "/chains2", },
    { name: 'chains-category', subPath: "/chains2/lending", },
    { name: 'yield-config', subPath: "/config/yields", },
    { name: 'outdated', subPath: "/outdated", },

    { name: 'emissions', subPath: "/emissions", },
    { name: 'emission-list', subPath: "/emissionsList", },
    { name: 'emissionsBreakdown', subPath: "/emissionsBreakdown", },
    { name: 'emissionsBreakdownAggregated', subPath: "/emissionsBreakdownAggregated", },
    { name: 'chainAssets', subPath: "/chainAssets", },

    { name: 'twitter-overview', subPath: "/twitter/overview", },

    { name: 'charts', subPath: "/charts", },
    { name: 'v2/historicalChainTvl', subPath: "/v2/historicalChainTvl", },

    { name: 'Dex volume overview', subPath: "/overview/dexs", },
    { name: 'Fee overview - arbitrum', subPath: "/overview/fees/arbitrum", },
    { name: 'dimensions-metadata', subPath: "/overview/_internal/dimensions-metadata", },
    { name: 'chain-id-map', subPath: "/overview/_internal/chain-name-id-map", },
  ]

  const endpoints = api2Routes.map(route => ({
    ...route,
    id: `api2-${route.name}`, // mandatory for sending notifications
    link: false, 
    url: `${env.tvl_api2_base}/${env.api2Subpath}${route.subPath}`,
  }))

  return {
    id: 'internal-api', // optional
    name: 'Internal API',
    endpoints: [
      {
        id: 'tvl-api2-hash', // mandatory for sending notifications
        name: 'Tvl api2 base',
        link: false,
        staleCheckInterval: 3 * ONE_DAY,  // changes once when there is a new commit
        url: `${env.tvl_api2_base}/hash`, // required
        sendNotificationEveryXMinutes: 60, // optional, send notification every X minutes defaults to 60
      },
      {
        id: 'dimensions-api2-hash',
        name: 'Dimensions api2 base',
        link: false,
        staleCheckInterval: 3 * ONE_DAY,
        url: `${env.dimensions_api2_base}/hash`,
      },
      {
        id: 'dimensions-internal-api-options',
        name: 'Options overview',
        link: false,
        url: `${env.dimensions_api2_base}/${env.api2Subpath}/overview/options?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`,
      },
      ...endpoints,
    ]
  }
}

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
  if (!env.indexerBase || !env.indexerApiKey) {
    return null
  }
  return {
    id: 'indexer-api',
    name: 'Indexer API',
    endpoints: [
      {
        id: 'indexer-api-sync',
        name: 'Indexer API sync',
        link: false,
        customCheck: async ({ endpointStatus }) => {
          const { data } = await axiosIndexerV1.get('/sync');
          endpointStatus.contentHash = hashString(data)
          return !!data.syncStatus
        },
      },
      {
        id: 'indexer-api-balances',
        name: 'Indexer API Balances',
        link: false,
        customCheck: async () => {
          const { data } = await axiosIndexerV1.get('/balances', {
            params: {
              addresses: '0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50',
            },
          });
          return !!data.balances
        },
      },
      {
        id: 'indexer-api-logs',
        name: 'Indexer API Logs',
        link: false,
        customCheck: async () => {
          const { data } = await axiosIndexerV1.get('/logs', {
            params: {
              addresses: '0xbb2b8038a1640196fbe3e38816f3e67cba72d940,0xdfc14d2af169b0d36c4eff567ada9b2e0cae044f',
              chainId: 1,
              topic0: '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822',
              from_block: 22018452,
              to_block: 22019085,
              limit: 10
            },
          });
          return !!data.logs
        },
      },
    ],
  }
}

function getIndexerApiV2() {
  if (!env.indexerBaseV2 || !env.indexerApiKeyV2) {
    return null
  }
  return {
    id: 'indexer-api',
    name: 'Indexer API V2',
    endpoints: [
      {
        id: 'indexer-api-v2-sync',
        name: 'Indexer API V2 sync',
        link: false,
        customCheck: async ({ endpointStatus }) => {
          const { data } = await axiosIndexerV2.get('/sync');
          endpointStatus.contentHash = hashString(data)
          return !!data.syncStatus
        },
      },
      {
        id: 'indexer-api-v2-balances',
        name: 'Indexer API V2 Balances',
        link: false,
        customCheck: async () => {
          const { data } = await axiosIndexerV2.get('/balances', {
            params: {
              addresses: '0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50',
            },
          });
          return !!data.balances
        },
      },
      {
        id: 'indexer-api-v2-logs',
        name: 'Indexer API V2 Logs',
        link: false,
        customCheck: async () => {
          const { data } = await axiosIndexerV2.get('/logs', {
            params: {
              addresses: '0xbb2b8038a1640196fbe3e38816f3e67cba72d940,0xdfc14d2af169b0d36c4eff567ada9b2e0cae044f',
              chainId: 1,
              topic0: '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822',
              from_block: 22018452,
              to_block: 22019085,
              limit: 10
            },
          });
          return !!data.logs
        },
      },
      {
        id: 'indexer-api-v2-token-Transfers',
        name: 'Indexer API V2 Token-Transfers',
        link: false,
        customCheck: async () => {
          const { data } = await axiosIndexerV2.get('/token-transfers', {
            params: {
              addresses: '0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50',
              chainId: 42161,
              from_block: 119877801,
              to_block: 119943935,
              from_address: true,
              to_address: true
            },
          });
          return !!data.transfers
        },
      },
      {
        id: 'indexer-api-v2-Transactions',
        name: 'Indexer API V2 Transactions',
        link: false,
        customCheck: async () => {
          const { data } = await axiosIndexerV2.get('/transactions', {
            params: {
              addresses: '0x28c6c06298d514db089934071355e5743bf21d60',
              chainId: 1,
              from_block: 19000000,
              to_block: 19001000,
              from_address: true,
              to_address: true,
              limit: 100
            },
          });
          return !!data.transactions
        },
      },
    ],
  }
}

function getStablecoinApi() {
  if (!env.stablecoinBase) {
    return null
  }
  return {
    id: 'stablecoin-api',
    name: 'Stablecoin API',
    interval: ONE_HOUR,
    endpoints: [
      {
        id: 'stablecoin-api-config',
        name: 'Config',
        link: false,
        staleCheckInterval: false, // this doesnt change very often
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

function coinsCheck(queries, interval) {
  return async ({ jsonContent }) => {
    const { coins } = jsonContent;
    const now = Date.now() / 1000;
    let status = true;

    queries.map((pk) => {
      const coin = coins[pk];
      if (!coin) throw new Error(`Coin ${pk} is missing`);
      
      const { price, decimals, symbol, timestamp } = coin;
      if (!price || !symbol || !timestamp) throw new Error(`Coin ${pk} is missing price, symbol, or timestamp`);
      else if (!pk.startsWith('coingecko:') && !decimals) throw new Error(`Coin ${pk} is missing decimals`);
      else if (now - coin.timestamp > interval * 60 * 1.2) throw new Error(`Coin ${pk} is stale`);
    })

    return status
  }
}

function getCoinsApi() {
  const QUERIES = [
    'coingecko:ethereum', 
    'coingecko:tether', 
    'ethereum:0x0000000000000000000000000000000000000000',  // Gas token mapping
  ]
  const defiCoinsEndpoints = getDefiCoinsApi().endpoints

  return {   
    id: 'coins-api',
    name: 'Coins API',
    discordWebhookUrl: env.coinsWebhookUrl, // optional
    endpoints: [
      {
        id: 'coins-api-protocols',
        name: 'Get token price',
        url: `${env.coinsBase}/prices/current/${QUERIES.join(',')}`,
        customCheck: coinsCheck(QUERIES, ONE_HOUR)
      },
      ...defiCoinsEndpoints
    ],
  }
}


function getDefiCoinsApi() {
  const QUERIES = [
    'ethereum:0xf5e27cce3c82326616784638ef7201fdc242bf89', // Euler V2
    'arbitrum:0x821cac5cb29c2d9c99c63be153316a479d550d72', // Pendle SY 
    'hyperliquid:0xc8b6e0acf159e058e22c564c0c513ec21f8a1bf5', // hywstHYPE
  ]

  return {
    id: 'defi-coins-api',
    name: 'Defi Coins API',
    staleCheckInterval: 3 * ONE_HOUR,
    endpoints: [
      {
        id: 'coins-api-defi-protocols',
        name: 'Get defi token price',
        url: `${env.coinsBase}/prices/current/${QUERIES.join(',')}`,
        customCheck: coinsCheck(QUERIES, 3 * ONE_HOUR)
      },
    ],
  }
}

function getYieldApi() {
  if (!env.yieldInternalBase) {
    return null
  }
  return {
    id: 'yield-api',
    name: 'Yield API',
    interval: ONE_HOUR,
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
        staleCheckInterval: false, // this doesnt change very often
        url: `${env.yieldInternalBase}/chart/747c1d2a-c668-4682-b9f9-296708a3dd90`,
      },
    ],
  }
}

function getPublicSites() {
  return {
    id: 'public',
    name: 'Public sites',
    staleCheckInterval: false, // this doesnt change very often
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

function getRpcAggWorkerEndpoints() {
  if (!env.rpcAggWorker) {
    return null
  }

  // supported chains on defillama swap
  let evmChains = ['ethereum', 'arbitrum', 'optimism', 'base', 'polygon', 'bsc', 'avax', 'fantom', 'sonic', 'era', 'polygon_zkevm', 'linea', 'xdai', 'klaytn', 'celo', 'scroll', 'aurora']
  const problembaticChainsSet = new Set(['fantom', 'aurora',])
  evmChains = evmChains.filter(chain => !problembaticChainsSet.has(chain))

  const evmChainConfigs = evmChains.map(chain => {
    return {
      id: chain,
      name: chain,
      url: `${env.rpcAggWorker}/${chain}`,
      request: {
        method: 'POST',
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
        }),
        headers: {
          'Content-Type': 'application/json',
        }
      },
      link: false,
      customCheck: async ({ jsonContent }) => {
        return !isNaN(+jsonContent.result)
      },
    }
  })

  // solana
  const solanaChainConfigs = ['solana'].map(chain => {
    return {
      id: chain,
      name: chain,
      url: `${env.rpcAggWorker}/${chain}`,
      request: {
        method: 'POST',
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'getEpochInfo',
          params: [],
        }),
        headers: {
          'Content-Type': 'application/json',
        }
      },
      link: false,
      customCheck: async ({ jsonContent }) => {
        return !isNaN(+jsonContent.result.blockHeight)
      },
    }
  })

  // starknet
  const starknetChainConfigs = ['starknet'].map(chain => {
    return {
      id: chain,
      name: chain,
      url: `${env.rpcAggWorker}/${chain}`,
      request: {
        method: 'POST',
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'starknet_blockNumber',
          params: [],
        }),
        headers: {
          'Content-Type': 'application/json',
        }
      },
      link: false,
      customCheck: async ({ jsonContent }) => {
        return !isNaN(+jsonContent.result)
      },
    }
  })

  // sui
  const suiChainConfigs = ['sui'].map(chain => {
    return {
      id: chain,
      name: chain,
      url: `${env.rpcAggWorker}/${chain}`,
      request: {
        method: 'POST',
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'suix_getLatestSuiSystemState',
          params: [],
        }),
        headers: {
          'Content-Type': 'application/json',
        }
      },
      link: false,
      customCheck: async ({ jsonContent }) => {
        return !isNaN(+jsonContent.result.epoch)
      },
    }
  })

  // aptos
  const aptosChainConfigs = ['aptos', 'move'].map(chain => {
    return {
      id: chain,
      name: chain,
      url: `${env.rpcAggWorker}/${chain}/v1`,
      request: {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      },
      link: false,
      customCheck: async ({ jsonContent }) => {
        return !isNaN(+jsonContent.epoch)
      },
    }
  })

  return {
    id: 'rpc-agg-worker',
    name: 'RPC Aggregator Worker',
    staleCheckInterval: ONE_HOUR,
    endpoints: evmChainConfigs
      .concat(solanaChainConfigs)
      .concat(starknetChainConfigs)
      .concat(suiChainConfigs)
      .concat(aptosChainConfigs),
  }
}

function getProApi() {
  if (!env.proKey)
    return null

  return {
    id: 'pro-api', // optional
    name: 'Pro API',
    endpoints: [
      {
        id: 'pro-api-options',
        name: 'Options overview',
        link: false,
        url: `https://pro-api.llama.fi/${env.proKey}/api/overview/options?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`,
        customCheck: async ({ jsonContent }) => {
          return jsonContent.totalAllTime > 0
        },
      },
      {
        id: 'pro-api-stablecoins',
        name: 'Stablecoins',
        link: false,
        url: `https://pro-api.llama.fi/${env.proKey}/stablecoins/stablecoinchains`,
        customCheck: async ({ jsonContent }) => {
          return jsonContent.length > 10
        },
      },
      {
        id: 'pro-api-etf',
        name: 'ETFs',
        link: false,
        staleCheckInterval: false,
        url: `https://pro-api.llama.fi/${env.proKey}/etfs/overview`,
        customCheck: async ({ jsonContent }) => {
          return jsonContent.length > 3
        },
      },
      {
        id: 'pro-api-protocols',
        name: 'Protocols overview',
        link: false,
        url: `https://pro-api.llama.fi/${env.proKey}/api/protocols`,
        customCheck: async ({ jsonContent }) => {
          return jsonContent.length > 10
        },
      },
      {
        id: 'pro-api-usage',
        name: 'usage',
        link: false,
        staleCheckInterval: false,
        url: `https://pro-api.llama.fi/usage/${env.proKey}`,
        customCheck: async ({ jsonContent }) => {
          return jsonContent.creditsLeft > 10
        },
      },
      {
        id: 'pro-api-emissions',
        name: 'emissions',
        link: false,
        staleCheckInterval: false,
        url: `https://pro-api.llama.fi/${env.proKey}/api/emission/aptos`,
      },
      {
        id: 'pro-api-tvl-categories',
        name: 'Tvl categories',
        link: false,
        staleCheckInterval: false,
        url: `https://pro-api.llama.fi/${env.proKey}/api/categories`,
      },
      {
        id: 'pro-api-coins',
        name: 'Coins',
        link: false,
        url: `https://pro-api.llama.fi/${env.proKey}/coins/prices/current/coingecko:ethereum`,
        customCheck: async ({ jsonContent }) => {
          return jsonContent.coins["coingecko:ethereum"].price > 0
        },
      },
    ]
  }
}
