import FortuneLotsClient from "./FortuneLotsClient";

export const metadata = {
  title: "靈籤求籤 · AI 解籤",
  description: "觀音靈籤（100 首）或六十甲子籤（60 支）程式抽籤，Gemini 解籤",
};

export default function FortuneLotsPage() {
  return <FortuneLotsClient />;
}
