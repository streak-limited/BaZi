export interface GuanyinLot {
  id: number;
  level: string;
  poem: string;
  allusion: string;
}

export interface GuanyinDrawResult {
  question: string;
  lot: GuanyinLot;
}
