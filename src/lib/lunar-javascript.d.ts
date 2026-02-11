declare module 'lunar-javascript' {
    export class Solar {
        static fromYmd(y: number, m: number, d: number): Solar;
        static fromDate(date: Date): Solar;
        getLunar(): Lunar;
        getYear(): SolarYear;
        toYmd(): string;
    }
    export class Lunar {
        getMonthInChinese(): string;
        getDayInChinese(): string;
        getYearInGanZhi(): string;
        getYearInGanZhiByLiChun(): string;
        getMonthInGanZhi(): string;
        getMonthInGanZhiExact(): string;
        getDayInGanZhi(): string;
        getYearGan(): string;
        getYearZhi(): string;
        getMonthGan(): string;
        getMonthZhi(): string;
        getDayGan(): string;
        getDayZhi(): string;
        getMonth(): number;
        getDay(): number;
        getJieQi(): string;
        getZhongQi(): string;
        getPrevJie(): SolarTerm;
        getPrevZhong(): SolarTerm;
        getNextJie(): SolarTerm;
        getNextZhong(): SolarTerm;
    }
    export class SolarYear {
        getSolarTerms(): SolarTerm[];
    }
    export class SolarTerm {
        getName(): string;
        getJulianDay(): JulianDay;
        getSolar(): Solar;
    }
    export class JulianDay {
        getSolar(): SolarTime;
    }
    export class SolarTime {
        toYmdHms(): string;
    }
}
