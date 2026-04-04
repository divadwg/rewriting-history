import { CaseStudy } from '../types/graph';
import gulfOfTonkin from './gulf-of-tonkin.json';
import iraqiWmds from './iraqi-wmds.json';
import sykesPicot from './sykes-picot.json';
import katynMassacre from './katyn-massacre.json';
import hillsborough from './hillsborough.json';
import dreyfusAffair from './dreyfus-affair.json';
import bengalFamine from './bengal-famine.json';

const cases: CaseStudy[] = [
  gulfOfTonkin as CaseStudy,
  iraqiWmds as CaseStudy,
  sykesPicot as CaseStudy,
  katynMassacre as CaseStudy,
  hillsborough as CaseStudy,
  dreyfusAffair as CaseStudy,
  bengalFamine as CaseStudy,
];

export function getAllCases(): CaseStudy[] {
  return cases;
}

export function getCaseById(id: string): CaseStudy | undefined {
  return cases.find(c => c.id === id);
}
