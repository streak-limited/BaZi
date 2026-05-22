import { getReportData } from "@/lib/report-data";
import ReportViewer from "./ReportViewer";

export const metadata = {
  title: "Report content · BaZi",
  description: "Browse and filter report content by page and type",
};

export default function ReportPage() {
  const data = getReportData();
  return (
    <ReportViewer
      data={data}
      title="Report content breakdown"
      showPageFilter
      secondaryNavHref="/bazi/result"
      secondaryNavLabel="Pre-report →"
    />
  );
}
