import { CaseStudy } from '../types/graph';
import gulfOfTonkin from './gulf-of-tonkin.json';
import iraqiWmds from './iraqi-wmds.json';
import sykesPicot from './sykes-picot.json';

const cases: CaseStudy[] = [
  gulfOfTonkin as CaseStudy,
  iraqiWmds as CaseStudy,
  sykesPicot as CaseStudy,
];

export function getAllCases(): CaseStudy[] {
  return cases;
}

export function getCaseById(id: string): CaseStudy | undefined {
  return cases.find(c => c.id === id);
}
