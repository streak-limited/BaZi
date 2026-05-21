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
      {
        source: "/report",
        destination: "/bazi/report",
        permanent: true,
      },
      {
        source: "/pre-report",
        destination: "/bazi/pre-report",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
