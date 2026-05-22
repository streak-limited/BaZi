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
        source: "/bazi",
        destination: "/m/bazi-full-report/intro",
        permanent: false,
      },
      {
        source: "/bazi/intro",
        destination: "/m/bazi-full-report/intro",
        permanent: false,
      },
      {
        source: "/bazi/input",
        destination: "/m/bazi-full-report/input",
        permanent: false,
      },
      {
        source: "/bazi/flow",
        destination: "/m/bazi-full-report/intro",
        permanent: true,
      },
      {
        source: "/flow",
        destination: "/m/bazi-full-report/intro",
        permanent: true,
      },
      {
        source: "/r/:token/pre-report",
        destination: "/r/:token/result",
        permanent: true,
      },
      {
        source: "/pre-report",
        destination: "/bazi/result",
        permanent: true,
      },
      {
        source: "/bazi/pre-report",
        destination: "/bazi/result",
        permanent: true,
      },
      {
        source: "/report",
        destination: "/bazi/report",
        permanent: true,
      },
      {
        source: "/api/bazi-flow/generate-pre-report",
        destination: "/api/bazi/generate-result",
        permanent: true,
      },
      {
        source: "/api/trials/:token/pre-report",
        destination: "/api/trials/:token/result",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
