import AskGuaClient from "./AskGuaClient";

export const metadata = {
  title: "AI 問卦",
  description: "文王六爻起卦與 AI 解卦",
};

export default function AskGuaPage() {
  return <AskGuaClient />;
}
