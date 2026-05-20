declare module "lunar-javascript" {
  export class Solar {
    static fromYmdHms(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second: number,
    ): Solar;
    static fromDate(date: Date): Solar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getLunar(): Lunar;
  }

  export class Lunar {
    static fromYmd(year: number, month: number, day: number): Lunar;
    getSolar(): Solar;
    getYearInGanZhi(): string;
    getEightChar(): EightChar;
  }

  export class EightChar {
    toString(): string;
    getYear(): string;
    getMonth(): string;
    getDay(): string;
    getTime(): string;
    getYearShiShenGan(): string;
    getYearShiShenZhi(): string[];
    getMonthShiShenGan(): string;
    getMonthShiShenZhi(): string[];
    getTimeShiShenGan(): string;
    getTimeShiShenZhi(): string[];
    getYearHideGan(): string[];
    getMonthHideGan(): string[];
    getDayHideGan(): string[];
    getTimeHideGan(): string[];
    getYun(gender: number): Yun;
  }

  export class Yun {
    getDaYun(): DaYun[];
  }

  export class DaYun {
    getGanZhi(): string;
    getStartAge(): number;
    getEndAge(): number;
  }
}
