import type { AstrologyMode, BirthPlace } from "@/lib/astrology/types";

export interface StoredChartSummary {
  id: string;
  subjectId: string;
  mode: AstrologyMode;
  birthPlaceLabel: string;
  partnerSubjectId?: string;
  coupleType?: string;
  createdAt: string;
}

export interface StoredAstrologyChart {
  id: string;
  subjectId: string;
  mode: AstrologyMode;
  birthPlace: BirthPlace;
  birthPlaceB?: BirthPlace;
  partnerSubjectId?: string;
  coupleType?: string;
  chartJson: unknown;
  createdAt: string;
}
