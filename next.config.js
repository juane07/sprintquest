/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tqbhvarahkdqlrtnxuwb.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_nqxBgCGT5nXq1Kc7d1tyZg_zRTaBmOu',
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // `no-store` already forbids HTTP caching. The old
          // `Clear-Site-Data: "cache", "storage"` header went further and
          // wiped localStorage on every navigation — it was there to defeat
          // the (already unregistered) service worker, and it cost a storage
          // teardown plus the participant identity, board preference and mute
          // flag on every single page load.
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
    ];
  },
};
module.exports = nextConfig;