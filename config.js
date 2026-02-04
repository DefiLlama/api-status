
import axios from 'axios';
import https from 'https';
const { reImport, hashString } = await import('./util.js')
let env = await reImport('./env.js')
import * as sdk from '@defillama/sdk'

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
    getCoinsApi(),
    getESTests(),
    getPublicSites(),
    getIndexerApi(),
    // getIndexerApiV2(),
    getDimensionsApi(),
    getStablecoinApi(),
    getTvlApi(),
    getYieldApi(),
    getRpcAggWorkerEndpoints(),
    getLlamaRpc(),
    getProApi(),
    getJenApi(),
    getJenApiV2(),
    getNFTApis(),
    getHyperliquidIndexer(),
    getTradfiDATApi(),
    getPBApi(),
    getAuthApi(),
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
              addresses: '0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50', chainId: 1, type: 'erc20'
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
        id: 'coins-api-update',
        name: 'Token update count',
        customCheck: async () => {
          if (!env.coinsDB) throw new Error('No coinsDB url')
          const endpoint = `${env.coinsDB}/coins-timeseries-*/_search`
          const { data: { aggregations: { uniquePids, adapterBreakdown } } } = await axios.post(endpoint, {
            "size": 0,
            "query": {
              "range": {
                "ts": {
                  "gte": "now-80m",
                  "lte": "now"
                }
              }
            },
            "aggs": {
              "uniquePids": {
                "cardinality": {
                  "field": "pid"
                }
              },
              "adapterBreakdown": {
                "terms": {
                  "field": "adapter",
                  "size": 11
                },
                "aggs": {
                  "pids": {
                    "cardinality": {
                      "field": "pid"
                    }
                  }
                }
              }
            }
          }, {
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
          })
          const adapterMap = {}
          adapterBreakdown.buckets.forEach(b => {
            adapterMap[b.key] = b.pids.value
          })

          const errorMessage = (str) => {
            throw new Error(str + ` Too few updates: ${str} (in the last 80 minutes)`)
          }
          if (uniquePids.value < 2000) errorMessage(`total unique coin updates: ${uniquePids.value}`)
          if (!adapterMap.coingecko || adapterMap.coingecko < 1000) errorMessage(`coingecko adapter: ${adapterMap.coingecko}`)
          if (!adapterMap.uniswap || adapterMap.uniswap < 400) errorMessage(`uniswap adapter: ${adapterMap.uniswap}`)
          if (Object.keys(adapterMap).length < 9) errorMessage(`Too few adapters returned data: ${Object.keys(adapterMap).length}`)
          return true
        }
      },
      {
        id: 'coins-api-protocols',
        name: 'Get token price',
        url: `${env.coinsBase}/prices/current/${QUERIES.join(',')}`,
        customCheck: coinsCheck(QUERIES, ONE_HOUR)
      },
      ...defiCoinsEndpoints,
      
      // block/:chain/:timestamp
      {
        id: 'coins-api-chain-blocks',
        name: 'Get chain block',
        url: `${env.coinsBase}/block/ethereum/${Math.round(new Date().getTime() / 1000) - 600}`, // get block last 10 minutes
        customCheck: async ({ jsonContent }) => {
          const { height, timestamp } = jsonContent;

          return Number(height) > 0 && Number(timestamp) > 0;
        }
      },
    ],
  }

  function getDefiCoinsApi() {
    const QUERIES = [
      'ethereum:0xd8b27cf359b7d15710a5be299af6e7bf904984c2', // Euler V2
      'ethereum:0xb327ead785574789bf4f7ef32bcdeae9513983d1', // Pendle PT 
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

function getNFTApis() {
  return {
    id: 'nft',
    name: 'NFT API',
    staleCheckInterval: false, // this doesnt change very often
    interval: 30, // Interval in minutes between each pulse
    responseTimeGood: 60_000, // In milliseconds, this and below will be green
    responseTimeWarning: 120_000, // In milliseconds, above this will be red
    timeout: 240_000, // In milliseconds, requests will be aborted above this
    discordWebhookUrl: env.infraWebhookUrl, //  to send notifications through discord
    endpoints: [
      {
        id: 'nft-site',
        name: 'NFT Collections',
        url: `https://nft.llama.fi/collections`,
      },
      {
        id: 'nft-royalties',
        name: 'NFT Royalties',
        url: `https://nft.llama.fi/royalties`,
      },
      {
        id: 'nft-exchange-volume',
        name: 'NFT Exchange Volume',
        url: `https://nft.llama.fi/exchangeVolume`,
      }
    ],
  }
}

function getRpcAggWorkerEndpoints() {
  if (!env.rpcAggWorker) {
    return null
  }

  // supported chains on defillama swap
  let evmChains = ['ethereum', 'arbitrum', 'optimism', 'base', 'polygon', 'bsc', 'avax', 'fantom', 'sonic', 'era', 'polygon_zkevm', 'linea', 'xdai', 'klaytn', 'celo', 'scroll', 'aurora', 'unichain']
  const problembaticChainsSet = new Set(['fantom', 'aurora', 'polygon_zkevm'])
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
  const aptosChainConfigs = ['aptos'].map(chain => {
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

async function fetchBlockNumber(rpcUrl) {
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_blockNumber',
        params: [],
      }),
    })
    const json = await res.json()
    const hex = json?.result?.number || json?.result
    return typeof hex === 'string' ? parseInt(hex, 16) : null
  } catch (e) {
    console.error(`Failed fetching from ${rpcUrl}:`, e.message)
    return null
  }
}

function getLlamaRpc() {
  if (!env.llamaRpcKey) return null

  const referenceUrls = {
    ethereum: [
      'https://eth.drpc.org',
      'https://1rpc.io/eth',
    ],
    base: [
      'https://mainnet.base.org',
      'https://base.drpc.org',
    ],
  }

  const tolerance = 10

  const getEndpoint = (id, url, chain) => ({
    id,
    name: id,
    url: `${url}?apikey=${env.llamaRpcKey}`,
    request: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBlockByNumber',
        params: ['latest', false],
      }),
    },
    link: false,
    customCheck: async ({ jsonContent }) => {
      const blockHex = jsonContent?.result?.number || jsonContent?.result
      if (typeof blockHex !== 'string') return false
      const num = parseInt(blockHex, 16)

      const urls = referenceUrls[chain] || []
      const refs = await Promise.all(urls.map(fetchBlockNumber))
      const validRefs = refs.filter(n => Number.isFinite(n))

      if (validRefs.length === 0) {
        console.warn(`[${id}] No valid reference RPCs responded`)
        return Number.isFinite(num) && num > 0
      }

      const ok = validRefs.some(ref => Math.abs(ref - num) <= tolerance)
      if (!ok) console.warn(`[${id}] OUT OF SYNC: ${num}, refs=${validRefs.join(', ')}`)
      return ok
    },
  })

  return {
    id: 'llama-rpcs',
    name: 'Llama RPCs',
    endpoints: [
      // getEndpoint('ethereum-reth-(new)', env.eth_reth, 'ethereum'),
      getEndpoint('base', env.base_reth, 'base'),
    ],
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
          return jsonContent.hasOwnProperty('creditsLeft') && typeof jsonContent.creditsLeft === 'number'
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


function getJenApi() {
  if (!env.jenKey || !env.jenURL)
    return null

  const client = axios.create({
    auth: {
      username: env.jenKey.split(':')[0],
      password: env.jenKey.split(':')[1],
    },
    baseURL: env.jenURL,
  })
  const MINUTE = 60 * 1000
  const HOUR = 60 * MINUTE
  const DAY = 24 * HOUR

  const getItemConfig = ({ job, name, time = HOUR, runTimeMin = 0, interval = 30, needSuccessful = true } = {}) => {
    if (!name) name = job
    return {
      id: `jen-${job}`,
      name,
      link: false,
      interval,
      customCheck: async () => {
        let runInfos = []

        // pull job run info
        try {
          const { data } = await client.get(`/job/${job}/wfapi/runs`)
          runInfos = data
        } catch (error) {
          console.error(error)
          throw new Error('Unable to fetch data from jenkins')
        }


        // check if the last job run was successful
        if (needSuccessful) {

          const lastSuccessfulRun = runInfos.find(run => run.status === 'SUCCESS')
          const minLastSuccessfulRun = +Date.now() - time
          if (!lastSuccessfulRun) throw new Error('No successful runs found')
          if (lastSuccessfulRun.startTimeMillis < minLastSuccessfulRun) throw new Error('Last successful run is too old ' + new Date(lastSuccessfulRun.startTimeMillis).toISOString() + `diff: ${minLastSuccessfulRun - lastSuccessfulRun.startTimeMillis}ms`)
        }

        // check if the jobs ran for the minimum required time
        if (runTimeMin > 0) {
          const minJobStartTime = +Date.now() - time
          const filteredJobs = runInfos.filter(run => run.startTimeMillis > minJobStartTime)
          if (filteredJobs.length === 0) throw new Error('No jobs found that ran in the last ' + time + 'ms')
          // check if at least one job in given time period ran over minimum time period
          if (!filteredJobs.some(run => run.durationMillis > runTimeMin)) throw new Error('No jobs found that ran over minimum time period' + runTimeMin + 'ms')
        }

        return true
      },
    }
  }

  return {
    id: 'jen-api',
    name: 'Jenkins API',
    endpoints: [
      // { job: '(coins) Fetch CG Min - over100m', time: 5 * MINUTE, interval: 3, },
      // { job: '(coins) Fetch CG Min - over10m', time: 30 * MINUTE, interval: 10, },
      // { job: '(coins) Fetch CG Min - over1m', time: 2 * HOUR, },
      // { job: '(coins) Store Defi Coins', time: 2 * HOUR, },
      // { job: '(coins) Store Bridge Coins', time: 2 * HOUR, },
      // { job: '(coins) Fetch CG Min - under1m (rest)', time: 6 * HOUR, },
      // { job: '(dimensions) pull data - v2', time: 3 * HOUR, runTimeMin: 5 * MINUTE },  // moved to jenkins v2
      // { job: '(dimensions) fill missing datapoints', time: 2 * DAY, runTimeMin: 5 * MINUTE, needSuccessful: false, },  // moved to jenkins v2
      // { job: '(tvl) update tvl data - v2', time: 2 * HOUR, runTimeMin: 5 * MINUTE, needSuccessful: false, },
    ].map(getItemConfig),
  }
}

function getJenApiV2() {
  if (!env.jenKey || !env.jenURLV2)
    return null

  const client = axios.create({
    auth: {
      username: env.jenKey.split(':')[0],
      password: env.jenKey.split(':')[1],
    },
    baseURL: env.jenURLV2,
  })
  const MINUTE = 60 * 1000
  const HOUR = 60 * MINUTE
  const DAY = 24 * HOUR

  const getItemConfig = ({ job, name, time = HOUR, runTimeMin = 0, interval = 30, needSuccessful = true } = {}) => {
    if (!name) name = job
    return {
      id: `jen-${job}`,
      name,
      link: false,
      interval,
      customCheck: async () => {
        let runInfos = []

        // pull job run info
        try {
          const { data } = await client.get(`/job/${job}/wfapi/runs`)
          runInfos = data
        } catch (error) {
          console.error(error)
          throw new Error('Unable to fetch data from jenkins')
        }


        // check if the last job run was successful
        if (needSuccessful) {

          const lastSuccessfulRun = runInfos.find(run => run.status === 'SUCCESS')
          const minLastSuccessfulRun = +Date.now() - time
          if (!lastSuccessfulRun) throw new Error('No successful runs found')
          if (lastSuccessfulRun.startTimeMillis < minLastSuccessfulRun) throw new Error('Last successful run is too old ' + new Date(lastSuccessfulRun.startTimeMillis).toISOString() + `diff: ${minLastSuccessfulRun - lastSuccessfulRun.startTimeMillis}ms`)
        }

        // check if the jobs ran for the minimum required time
        if (runTimeMin > 0) {
          const minJobStartTime = +Date.now() - time
          const filteredJobs = runInfos.filter(run => run.startTimeMillis > minJobStartTime)
          if (filteredJobs.length === 0) throw new Error('No jobs found that ran in the last ' + time + 'ms')
          // check if at least one job in given time period ran over minimum time period
          if (!filteredJobs.some(run => run.durationMillis > runTimeMin)) throw new Error('No jobs found that ran over minimum time period' + runTimeMin + 'ms')
        }

        return true
      },
    }
  }

  return {
    id: 'jen-api-v2',
    name: 'Jenkins API V2',
    endpoints: [
      { job: 'coins/job/(coins) Fetch CG Min - over100m', time: 5 * MINUTE, interval: 3, },
      { job: 'coins/job/(coins) Fetch CG Min - over10m', time: 30 * MINUTE, interval: 10, },
      { job: 'coins/job/(coins) Fetch CG Min - over1m', time: 2 * HOUR, },
      { job: 'coins/job/(coins) Store Defi Coins', time: 2 * HOUR, },
      { job: 'coins/job/(coins) Store Bridge Coins', time: 2 * HOUR, },
      { job: 'coins/job/(coins) Fetch CG Min - under1m (rest)', time: 6 * HOUR, },
      { job: 'dimensions/job/(dimensions) pull data - v2', time: 3 * HOUR, runTimeMin: 5 * MINUTE },
      { job: 'dimensions/job/(dimensions) fill missing datapoints', time: 2 * DAY, runTimeMin: 5 * MINUTE, needSuccessful: false },
      { job: 'tvl/job/(tvl) update tvl data - v2', time: 2 * HOUR, runTimeMin: 5 * MINUTE, needSuccessful: false }
    ].map(getItemConfig),
  }
}

export function getHourUnixTimestamp() {
  const timestamp = Math.floor(new Date().getTime() / 1000)
  const theDay = new Date().toISOString().split('T')[0];
  let startHourTimestamp = Math.floor(new Date(theDay).getTime() / 1000);

  while (startHourTimestamp <= timestamp - 3600) {
    startHourTimestamp += 3600;
  }

  return startHourTimestamp;
}

function getTradfiDATApi() {
  if (!env.tradfiApiBase)
    return null

  return {
    id: 'TradFi-api',
    name: 'TradFi API',
    endpoints: [
      {
        id: 'tradfi-dat-companies',
        name: 'TradFi DAT Companies',
        link: false,
        url: `${env.tradfiApiBase}v1/companies`
      },
    ],
  }
}

function getHyperliquidIndexer() {
  if (!env.hlIndexer)
    return null

  const dateString = (new Date()).toISOString().split('T')[0].replace('-', '').replace('-', '')
  const hourNumber = getHourUnixTimestamp()

  return {
    id: 'hl-indexer', // optional
    name: 'Hyperliquid Indexer',
    endpoints: [
      {
        id: 'hourly-data',
        name: 'Current Hourly Data',
        link: false,
        url: `${env.hlIndexer}/v1/data/hourly?date=${dateString}`,
        customCheck: async ({ jsonContent, endpointStatus }) => {
          const latestHourlyData = jsonContent.data.find(item => item.timestamp === hourNumber)
          endpointStatus.contentHash = hashString(String(latestHourlyData.perpsOpenInterestUsd))
          return latestHourlyData && (Number(latestHourlyData.perpsOpenInterestUsd) > 0) && (Number(latestHourlyData.perpsVolumeUsd) > 0)
        },
      },
    ]
  }
}


function getESTests() {

  async function getAppRuntimeLogs(application) {

    const esClient = sdk.elastic.getClient()

    // fetch successful logs in the last 2 hours, grouped by type and application
    const { aggregations: { byApplication } } = await esClient.search({
      index: 'debug-runtime-logs*',
      body: {
        "aggs": {
          "byApplication": {
            "terms": {
              "field": "metadata.application.keyword",
              "order": {
                "_count": "desc"
              },
              "size": 30
            },
            "aggs": {
              "byType": {
                "terms": {
                  "field": "metadata.type.keyword",
                  "order": {
                    "_count": "desc"
                  },
                  "size": 30
                }
              }
            }
          }
        },
        "size": 0,
        "_source": {
          "excludes": []
        },
        "query": {
          "bool": {
            "must": [],
            "filter": [
              {
                "bool": {
                  "should": [
                    {
                      "match": {
                        "success": true
                      }
                    }
                  ],
                  "minimum_should_match": 1
                }
              },
              {
                "range": {
                  "timestamp": {
                    gte: 'now-2h', // last 2 hours
                    lt: 'now'
                  }
                }
              }
            ],
            "should": [],
            "must_not": []
          }
        },
        "stored_fields": [
          "*"
        ],
        "runtime_mappings": {},
        "script_fields": {},
        "fields": [
          {
            "field": "metadata.execution_ended_at",
            "format": "date_time"
          },
          {
            "field": "metadata.execution_started_at",
            "format": "date_time"
          },
          {
            "field": "metadata.expires_at",
            "format": "date_time"
          },
          {
            "field": "metadata.submitted_at",
            "format": "date_time"
          },
          {
            "field": "timestamp",
            "format": "date_time"
          }
        ]
      }
    });
    const applicationMap = {};
    for (const typeBucket of byApplication.buckets) {
      const { key: application, doc_count, byType } = typeBucket;
      applicationMap[application] = {
        count: doc_count,
        types: {}
      };
      for (const typeBucket of byType.buckets) {
        const { key: type, doc_count: typeCount } = typeBucket;
        applicationMap[application].types[type] = typeCount;
      }
    }

    return applicationMap[application]

    // sample response
    /*   {
          "dimensions": {
            "count": 10014,
            "types": {
              "protocol-chain": 10014
            }
          },
          "tvl": {
            "count": 6066,
            "types": {
              "protocol": 5845,
              "treasury": 195,
              "entity": 26
            }
          },
          "allium": {
            "count": 275,
            "types": {}
          },
          "dune": {
            "count": 69,
            "types": {}
          },
          "cron-task": {
            "count": 29,
            "types": {
              "app-metadata": 8,
              "dimensions": 8,
              "tvl-data": 8,
              "raises": 5
            }
          }
        } */

  }

  return {
    id: 'es',
    name: 'ES logs',
    staleCheckInterval: false, // this doesnt change very often
    responseTimeGood: 60_000, // In milliseconds, this and below will be green
    responseTimeWarning: 120_000, // In milliseconds, above this will be red
    timeout: 240_000, // In milliseconds, requests will be aborted above this
    endpoints: [
      {
        id: 'tvl-runtime-logs',
        name: 'Tvl Runtime logs',
        customCheck: async () => {
          const logs = await getAppRuntimeLogs('tvl')
          if (!logs) throw new Error('No logs found for tvl')
          if (logs.count < 1000) throw new Error('Too few logs for tvl: ' + logs.count)
          return true
        }
      },
      {
        id: 'dimensions-runtime-logs',
        name: 'Dimensions Runtime logs',
        customCheck: async () => {
          const logs = await getAppRuntimeLogs('dimensions')
          if (!logs) throw new Error('No logs found for dimensions')
          if (logs.count < 1000) throw new Error('Too few logs for dimensions: ' + logs.count)
          return true
        }
      },
      {
        id: 'cron-task-runtime-logs',
        name: 'Cron Task Runtime logs',
        customCheck: async () => {
          const logs = await getAppRuntimeLogs('cron-task')
          if (!logs) throw new Error('No logs found for cron-task')
          if (logs.count < 10) throw new Error('Too few logs for cron-task: ' + logs.count)
          const checkTypes = ['dimensions', 'tvl-data', 'raises', 'app-metadata']
          for (const runType of checkTypes) {
            if (!logs.types[runType] || logs.types[runType] < 2) throw new Error('Too few ' + runType + ' logs for cron-task: ' + (logs.types[runType] || 0))
          }
          return true
        }
      },
    ],
  }
}


function getPBApi() {
  if (!env.pbApiBase)
    return null

  const client = axios.create({ baseURL: env.pbApiBase, })
  return {
    id: 'PB-api',
    name: 'PB API',
    discordWebhookUrl: env.teamsWebhookUrl,
    endpoints: [
      {
        id: 'PB-no-key',
        name: 'Healthcheck endpoint',
        link: false,
        staleCheckInterval: false,
        url: `${env.pbApiBase}/api/health`,
      },
      {
        id: 'PB-no-key-options',
        name: 'PB options call (check if service is up)',
        link: false,
        customCheck: async () => {
          const { data, status } = await client.options('/')
          return status < 300
        },
      },
    ],
  }
}

function getAuthApi() {
  if (!env.authApiBase || !env.pbApiBase || !env.pbAuthEmail || !env.pbAuthPassword)
    return null

  const getAuthClient = async () => {
    const pbClient = axios.create({ baseURL: env.pbApiBase })
    const authResponse = await pbClient.post('/api/collections/users/auth-with-password', {
      identity: env.pbAuthEmail,
      password: env.pbAuthPassword,
    })
    const client = axios.create({ baseURL: env.authApiBase, headers: { 'Authorization': `Bearer ${authResponse.data.token}` } })
    return client
  }

  return {
    id: 'auth-api',
    name: 'Auth API',
    discordWebhookUrl: env.teamsWebhookUrl,
    endpoints: [
      {
        id: 'auth-no-key-options',
        name: 'auth options call (check if service is up)',
        link: false,
        customCheck: async () => {
          const client = await getAuthClient()
          const { data, status } = await client.options('/user/front-hash')
          return status === 200
        },
      },
      {
        id: 'auth-check-hash',
        name: 'Check user hash',
        link: false,
        customCheck: async () => {
          const client = await getAuthClient()
          const { data, status } = await client.get('/user/front-hash')
          if (status !== 200)
            throw new Error('Status not 200')

          if (typeof data.userHash !== 'string' || data.userHash.length < 7)
            throw new Error('Invalid userHash value')

          return true
        },
      },
      {
        id: 'auth-user-config',
        name: 'User config',
        link: false,
        customCheck: async () => {
          const client = await getAuthClient()
          const { data, status } = await client.get('/user/config')
          if (status !== 200)
            throw new Error('Status not 200')

          if (typeof data.DARK_MODE !== 'boolean')
            throw new Error('Invalid DARK_MODE value')

          return true
        },
      },
    ],
  }
}
