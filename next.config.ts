import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "@libsql/client"],
  async redirects() {
    return [
      {
        source: "/guanyin-lots",
        destination: "/fortune-lots",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
