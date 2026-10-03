// Reuse Whale Run's browser-safe project, but never its room namespace.
// Publishable keys are public client configuration, NOT administrative keys.
export const ONLINE_CONFIG = Object.freeze({
  supabaseUrl:'https://ugglwnieqlqtaylotoyo.supabase.co',
  supabasePublishableKey:'sb_publishable_UtYMbspK-imzXAGEOYpgZA_WSewHIRC',
  channelPrefix:'arcade', appId:'slice-and-stitch', protocolVersion:1,
  privateChannels:false,
})
export const onlineConfigured = (config=ONLINE_CONFIG) => Boolean(config.supabaseUrl && config.supabasePublishableKey)
