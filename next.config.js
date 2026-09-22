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
          { key: "Cache-Control", value: "no-store, must-revalidate" },
          { key: "Clear-Site-Data", value: '"cache", "storage"' },
        ],
      },
    ]
  },
}
module.exports = nextConfig
