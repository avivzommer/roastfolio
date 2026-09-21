import 'dotenv/config';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '../generated/prisma/client.ts';

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });
const ids = ['GnA9SkgAGw', 'BL_uZW0uQX', 'BJy6RqcokA'];
const labels: Record<string, string> = {
  GnA9SkgAGw: 'Boris (expected: NOT great)',
  BL_uZW0uQX: 'Dana (expected: NOT great)',
  BJy6RqcokA: 'Ben (expected: GOOD)',
};

for (const id of ids) {
  const r = await prisma.review.findUnique({ where: { id } });
  const report: any = r?.report ? JSON.parse(r.report) : null;
  if (!report) { console.log(id, 'no report'); continue; }
  console.log('\n=== ' + labels[id] + ' ===');
  console.log('URL:', report.portfolioUrl);
  console.log('Verdict:', report.verdict, '| Overall:', report.overallScore, '| Inferred seniority:', report.inferredSeniority);
  console.log('Signal:', report.currentSignal);
  console.log('Scores:', JSON.stringify(report.scores));
  console.log('GrowthLever:', report.mainGrowthLever?.substring(0, 240));
  console.log('Priority 1:', report.priorityActionPlan?.[0]?.title);
  console.log('Case studies (' + (report.caseStudies?.length ?? 0) + '):');
  for (const cs of (report.caseStudies || [])) {
    console.log('  - ' + cs.name + ' (uiCraft ' + cs.scores?.uiCraft?.score + ' / uxThinking ' + cs.scores?.uxThinking?.score + ')');
    if (cs.actionCheck) {
      const a = cs.actionCheck;
      const details = Object.entries(a).map(([k,v]:any) => k + '=' + v.verdict).join(', ');
      console.log('    ACTION:', details);
    } else {
      console.log('    ACTION: (missing)');
    }
    if (cs.proveCheck) {
      const p = cs.proveCheck;
      const details = Object.entries(p).map(([k,v]:any) => k + '=' + v.verdict).join(', ');
      console.log('    PROVE:', details);
    } else {
      console.log('    PROVE: (missing)');
    }
  }
}

await prisma.$disconnect();
