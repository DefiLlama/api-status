export default {
  apiBase: process.env.API_BASE ?? 'https://api.llama.fi',
  coinsBase: process.env.COINS_BASE ?? 'https://coins.llama.fi',
  host: process.env.HOST_URL,
  tvl_api2_base: process.env.TVL_API2_BASE,
  dimensions_api2_base: process.env.DIMENSIONS_API2_BASE,
  api2Subpath: process.env.API2_SUBPATH,
  indexerBase: process.env.LLAMA_INDEXER_ENDPOINT,
  indexerApiKey: process.env.LLAMA_INDEXER_API_KEY,
  defaultWebhookUrl: process.env.DEFAULT_WEBHOOK_URL,
  stablecoinBase: process.env.STABLECOIN_BASE,
}