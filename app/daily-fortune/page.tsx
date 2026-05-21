import DailyFortuneClient from "./DailyFortuneClient";

export const metadata = {
  title: "每日開運運程",
  description: "沿用報告頁命主資料，八字、五行生肖、星座、生命靈數綜合每日運程與 AI 開運指引",
};

export default function DailyFortunePage() {
  return <DailyFortuneClient />;
}
