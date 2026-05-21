import ReportViewer from "@/app/bazi/report/ReportViewer";
import { getPreReportData } from "@/lib/pre-report-data";

export const metadata = {
  title: "Pre-report · 範山道令導流",
  description: "單頁 pre-report 內容拆解（static / computed / ai）",
};

export default function PreReportPage() {
  const data = getPreReportData();
  return (
    <ReportViewer
      data={data}
      title="Pre-report · 範山道令導流頁"
      subtitle={`單頁精簡版（對照完整 20 頁）· ${data.metadata.source}`}
      showPageFilter={false}
      secondaryNavHref="/bazi/report"
      secondaryNavLabel="完整報告 →"
    />
  );
}