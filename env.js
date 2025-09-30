import dotenv from 'dotenv';

dotenv.config();

export default {
  apiBase: process.env.API_BASE ?? 'https://api.llama.fi',
  coinsBase: process.env.COINS_BASE ?? 'https://coins.llama.fi',
  host: process.env.HOST_URL,
  tvl_api2_base: process.env.TVL_API2_BASE,
  eth_reth: process.env.ETH_RETH,
  base_reth: process.env.BASE_RETH,
  dimensions_api2_base: process.env.DIMENSIONS_API2_BASE,
  api2Subpath: process.env.API2_SUBPATH,
  indexerBase: process.env.LLAMA_INDEXER_ENDPOINT,
  indexerBaseV2: process.env.LLAMA_INDEXER_V2_ENDPOINT,
  indexerApiKey: process.env.LLAMA_INDEXER_API_KEY,
  indexerApiKeyV2: process.env.LLAMA_INDEXER_V2_API_KEY,
  defaultWebhookUrl: process.env.DEFAULT_WEBHOOK_URL,
  stablecoinBase: process.env.STABLECOIN_BASE,
  yieldInternalBase: process.env.YIELD_INTERNAL_BASE,
  rpcAggWorker: process.env.RPC_AGG_WORKER,
  coinsWebhookUrl: process.env.URGENT_COINS_WEBHOOK,
  proKey: process.env.PRO_API_KEY,
  jenKey: process.env.JEN_API_KEY,
  jenURL: process.env.JEN_URL,
  llamaRpcKey: process.env.LLAMA_RPC_KEY,
  infraWebhookUrl: process.env.INFRA_WEBHOOK_URL,
  hlIndexer: process.env.LLAMA_HL_INDEXER,
}