import { Injectable, Inject } from '@nestjs/common';
import { eq, and, gte, lte } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../database/schema';
import { invoices, expenses } from '../database/schema';

@Injectable()
export class ReportService {
  constructor(
    @Inject('DB_CONNECTION') private db: MySql2Database<typeof schema>,
  ) {}

  async getProfitLoss(startDate: string, endDate: string) {
    const revenueData = await this.db.query.invoices.findMany({
      where: and(
        eq(invoices.status, 'PAID' as any),
        gte(invoices.paidDate, new Date(startDate)),
        lte(invoices.paidDate, new Date(endDate)),
      ) as any,
    });
    const totalRevenue = revenueData.reduce((s, i) => s + parseFloat(i.total || '0'), 0);

    const expenseData = await this.db.query.expenses.findMany({
      where: and(
        gte(expenses.expenseDate, new Date(startDate)),
        lte(expenses.expenseDate, new Date(endDate)),
      ) as any,
    });
    const totalExpenses = expenseData.reduce((s, e) => s + parseFloat(e.amount || '0'), 0);

    return {
      period: { startDate, endDate },
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      revenueCount: revenueData.length,
      expenseCount: expenseData.length,
    };
  }

  async getPpnReport(year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;

    const paidInvoices = await this.db.query.invoices.findMany({
      where: and(
        eq(invoices.status, 'PAID' as any),
        gte(invoices.paidDate, new Date(startDate)),
        lte(invoices.paidDate, new Date(endDate)),
      ) as any,
    });

    const totalPpn = paidInvoices.reduce((s, i) => s + parseFloat(i.ppn || '0'), 0);
    const totalDpp = paidInvoices.reduce((s, i) => {
      const ppn = parseFloat(i.ppn || '0');
      const total = parseFloat(i.total || '0');
      return s + (total - ppn);
    }, 0);

    return {
      period: `${year}-${String(month).padStart(2, '0')}`,
      totalInvoices: paidInvoices.length,
      totalDpp,
      totalPpn,
      ppnRate: paidInvoices.length > 0 ? paidInvoices[0].ppnRate : '11.00',
    };
  }

  async getDashboard() {
    const now = new Date();
    const monthlyData: any[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
      const label = `${year}-${String(month).padStart(2, '0')}`;

      const monthRevenue = await this.db.query.invoices.findMany({
        where: and(
          eq(invoices.status, 'PAID' as any),
          gte(invoices.paidDate, new Date(startDate)),
          lte(invoices.paidDate, new Date(endDate)),
        ) as any,
      });
      const revenue = monthRevenue.reduce((s, i) => s + parseFloat(i.total || '0'), 0);

      const monthExpenses = await this.db.query.expenses.findMany({
        where: and(
          gte(expenses.expenseDate, new Date(startDate)),
          lte(expenses.expenseDate, new Date(endDate)),
        ) as any,
      });
      const expense = monthExpenses.reduce((s, e) => s + parseFloat(e.amount || '0'), 0);

      monthlyData.push({ label, revenue, expense, profit: revenue - expense });
    }

    return { monthly: monthlyData };
  }
}
