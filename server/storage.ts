import { 
  type User, type InsertUser,
  type Card, type InsertCard,
  type Branch, type InsertBranch,
  type Staff, type InsertStaff,
  type Transaction, type InsertTransaction,
  type Kpi, type InsertKpi,
  type StaffKpi, type InsertStaffKpi,
  type Referral, type InsertReferral,
  type ProfitSharing, type InsertProfitSharing,
  type ProfitDistribution, type InsertProfitDistribution,
  type InvestmentPackage, type InsertInvestmentPackage,
  type SystemConfig, type InsertSystemConfig,
  type AuditLog, type InsertAuditLog,
  type UserBalance, type InsertUserBalance,
  type DepositRequest, type InsertDepositRequest,
  type UserSharesHistory, type InsertUserSharesHistory,
  type BusinessTierConfig, type InsertBusinessTierConfig,
  type UserRoleUpdate, type TransactionApproval, type SystemConfigUpdate, type ReportExport,
  type BusinessTierUpgrade, type QrCheckin, type EnhancedWithdrawal, type UserProfileUpdate,
  validateQuarterBoundaries, determineBusinessTier, calculateShares, calculateWithdrawalTax
} from "@shared/schema";
import { randomUUID, scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Use the same password hashing as auth.ts
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Monetary utility functions to ensure consistent integer VND handling
function toIntegerVnd(amountString: string): number {
  return Math.floor(parseFloat(amountString || "0"));
}

function fromIntegerVnd(amountInteger: number): string {
  return Math.floor(amountInteger).toString();
}

function validatePercentageConfig(value: string): number {
  const num = parseFloat(value);
  if (isNaN(num) || num < 0 || num > 100) {
    throw new Error(`Invalid percentage config: ${value}. Must be between 0-100.`);
  }
  return num / 100;
}

type SessionStore = session.Store & {
  get: (sid: string, callback: (err: any, session?: session.SessionData | null) => void) => void;
  set: (sid: string, session: session.SessionData, callback?: (err?: any) => void) => void;
  destroy: (sid: string, callback?: (err?: any) => void) => void;
};

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Card operations
  getCards(): Promise<Card[]>;
  getCard(id: string): Promise<Card | undefined>;
  createCard(card: InsertCard): Promise<Card>;
  updateCard(id: string, card: Partial<InsertCard>): Promise<Card | undefined>;
  deleteCard(id: string): Promise<boolean>;
  
  // Branch operations
  getBranches(): Promise<Branch[]>;
  getBranch(id: string): Promise<Branch | undefined>;
  createBranch(branch: InsertBranch): Promise<Branch>;
  updateBranch(id: string, branch: Partial<InsertBranch>): Promise<Branch | undefined>;
  
  // Staff operations
  getStaff(): Promise<Staff[]>;
  getStaffMember(id: string): Promise<Staff | undefined>;
  createStaffMember(staff: InsertStaff): Promise<Staff>;
  updateStaffMember(id: string, staff: Partial<InsertStaff>): Promise<Staff | undefined>;
  deleteStaffMember(id: string): Promise<boolean>;
  
  // Transaction operations
  getTransactions(): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  
  // KPI operations
  getKpis(): Promise<Kpi[]>;
  getKpisByBranch(branchId: string): Promise<Kpi[]>;
  getKpisByPeriod(period: string, periodValue: string): Promise<Kpi[]>;
  createKpi(kpi: InsertKpi): Promise<Kpi>;
  updateKpi(id: string, kpi: Partial<InsertKpi>): Promise<Kpi | undefined>;
  calculateBranchKpi(branchId: string, period: string, periodValue: string): Promise<number>;
  
  // Staff KPI operations
  getStaffKpis(): Promise<StaffKpi[]>;
  getStaffKpisByStaff(staffId: string): Promise<StaffKpi[]>;
  getStaffKpisByPeriod(period: string, periodValue: string): Promise<StaffKpi[]>;
  createStaffKpi(staffKpi: InsertStaffKpi): Promise<StaffKpi>;
  updateStaffKpi(id: string, staffKpi: Partial<InsertStaffKpi>): Promise<StaffKpi | undefined>;
  calculateStaffKpiPoints(staffId: string, period: string, periodValue: string): Promise<number>;
  processQuarterlyShares(period: string, periodValue: string): Promise<void>;
  
  // Referral operations
  getReferrals(): Promise<Referral[]>;
  getReferralsByReferrer(referrerId: string): Promise<Referral[]>;
  getReferralByCode(referralCode: string): Promise<Referral | undefined>;
  createReferral(referral: InsertReferral): Promise<Referral>;
  updateReferral(id: string, referral: Partial<InsertReferral>): Promise<Referral | undefined>;
  generateReferralCode(staffId: string): Promise<string>;
  calculateReferralCommission(referralId: string): Promise<number>;
  processFirstTransaction(referralCode: string, transactionId: string): Promise<Referral | undefined>;
  markCommissionPaid(referralId: string, paidAmount: number): Promise<Referral | undefined>;
  processCommissionPayments(referrerId: string): Promise<number>;

  // Profit sharing operations
  getProfitSharings(): Promise<ProfitSharing[]>;
  getProfitSharing(id: string): Promise<ProfitSharing | undefined>;
  getProfitSharingByPeriod(period: string, periodValue: string): Promise<ProfitSharing | undefined>;
  createProfitSharing(profitSharing: InsertProfitSharing): Promise<ProfitSharing>;
  updateProfitSharing(id: string, profitSharing: Partial<InsertProfitSharing>): Promise<ProfitSharing | undefined>;
  calculateQuarterlyProfit(period: string, periodValue: string): Promise<{ revenue: number; expenses: number; profit: number }>;
  processQuarterlyProfitSharing(period: string, periodValue: string): Promise<ProfitSharing>;

  // Profit distribution operations
  getProfitDistributions(): Promise<ProfitDistribution[]>;
  getProfitDistributionsBySharing(profitSharingId: string): Promise<ProfitDistribution[]>;
  createProfitDistribution(distribution: InsertProfitDistribution): Promise<ProfitDistribution>;
  updateProfitDistribution(id: string, distribution: Partial<InsertProfitDistribution>): Promise<ProfitDistribution | undefined>;
  markDistributionPaid(distributionId: string): Promise<ProfitDistribution | undefined>;
  processAllDistributionPayments(profitSharingId: string): Promise<number>;

  // Investment package operations
  getInvestmentPackages(): Promise<InvestmentPackage[]>;
  getInvestmentPackage(id: string): Promise<InvestmentPackage | undefined>;
  getActiveInvestmentPackages(): Promise<InvestmentPackage[]>;
  createInvestmentPackage(packageData: InsertInvestmentPackage): Promise<InvestmentPackage>;
  updateInvestmentPackage(id: string, packageData: Partial<InsertInvestmentPackage>): Promise<InvestmentPackage | undefined>;
  
  // Cash flow operations
  createCashFlowTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getCashFlowTransactions(userId?: string): Promise<Transaction[]>;
  getCashFlowTransactionsByType(type: string): Promise<Transaction[]>;
  approveCashFlowTransaction(transactionId: string, approvedBy: string): Promise<Transaction | undefined>;
  rejectCashFlowTransaction(transactionId: string, approvedBy: string, reason?: string): Promise<Transaction | undefined>;
  calculateWithdrawalTax(amount: number): number;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: string, role: string, updatedBy: string): Promise<User | undefined>;
  getSystemConfigs(): Promise<SystemConfig[]>;
  getSystemConfig(configKey: string): Promise<SystemConfig | undefined>;
  updateSystemConfig(configKey: string, configValue: string, description?: string, updatedBy?: string): Promise<SystemConfig>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
  getPendingTransactions(): Promise<Transaction[]>;
  exportReportData(reportType: string, dateFrom?: string, dateTo?: string): Promise<any[]>;
  
  // Business logic operations
  // User balances
  getUserBalance(userId: string): Promise<UserBalance | undefined>;
  createUserBalance(balance: InsertUserBalance): Promise<UserBalance>;
  updateUserBalance(userId: string, balance: Partial<InsertUserBalance>): Promise<UserBalance | undefined>;
  addToUserBalance(userId: string, amount: number, description: string): Promise<UserBalance>;
  
  // Deposit requests 
  getDepositRequests(): Promise<DepositRequest[]>;
  getDepositRequest(id: string): Promise<DepositRequest | undefined>;
  getUserDepositRequests(userId: string): Promise<DepositRequest[]>;
  createDepositRequest(request: InsertDepositRequest): Promise<DepositRequest>;
  approveDepositRequest(requestId: string, approvedBy: string): Promise<DepositRequest | undefined>;
  rejectDepositRequest(requestId: string, approvedBy: string, reason: string): Promise<DepositRequest | undefined>;
  
  // User shares history
  getUserSharesHistory(userId: string): Promise<UserSharesHistory[]>;
  createUserSharesHistory(history: InsertUserSharesHistory): Promise<UserSharesHistory>;
  
  // Business tier configs
  getBusinessTierConfigs(): Promise<BusinessTierConfig[]>;
  getBusinessTierConfig(tierName: string): Promise<BusinessTierConfig | undefined>;
  createBusinessTierConfig(config: InsertBusinessTierConfig): Promise<BusinessTierConfig>;
  updateBusinessTierConfig(tierName: string, config: Partial<InsertBusinessTierConfig>): Promise<BusinessTierConfig | undefined>;
  
  // Business tier operations
  upgradeUserBusinessTier(userId: string, newTier: string, investmentAmount: number): Promise<User | undefined>;
  calculateUserShares(userId: string, amount: number): Promise<number>;
  updateUserShares(userId: string, shareAmount: number, description: string, transactionType: string): Promise<void>;
  checkMaxoutLimit(userId: string): Promise<{ reached: boolean; limit: number; current: number }>;
  
  // QR check-in operations
  createQrCheckin(checkin: { cardId: string; sessionType: string; notes?: string }): Promise<void>;
  updateCardSessions(cardId: string, decrement: number): Promise<Card | undefined>;
  
  // Enhanced withdrawal operations  
  createWithdrawalRequest(userId: string, amount: number, description: string): Promise<Transaction>;
  validateWithdrawalBalance(userId: string, amount: number): Promise<{ valid: boolean; availableBalance: number }>;
  
  // Quarterly profit sharing with maxout
  processQuarterlyProfitSharingWithMaxout(period: string, periodValue: string, respectMaxout: boolean): Promise<ProfitSharing>;
  
  // Session store
  sessionStore: SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private cards: Map<string, Card>;
  private branches: Map<string, Branch>;
  private staff: Map<string, Staff>;
  private transactions: Map<string, Transaction>;
  private kpis: Map<string, Kpi>;
  private staffKpis: Map<string, StaffKpi>;
  private referrals: Map<string, Referral>;
  private profitSharings: Map<string, ProfitSharing>;
  private profitDistributions: Map<string, ProfitDistribution>;
  private investmentPackages: Map<string, InvestmentPackage>;
  private systemConfigs: Map<string, SystemConfig>;
  private auditLogs: Map<string, AuditLog>;
  private userBalances: Map<string, UserBalance>;
  private depositRequests: Map<string, DepositRequest>;
  private userSharesHistory: Map<string, UserSharesHistory>;
  private businessTierConfigs: Map<string, BusinessTierConfig>;
  public sessionStore: SessionStore;

  constructor() {
    this.users = new Map();
    this.cards = new Map();
    this.branches = new Map();
    this.staff = new Map();
    this.transactions = new Map();
    this.kpis = new Map();
    this.staffKpis = new Map();
    this.referrals = new Map();
    this.profitSharings = new Map();
    this.profitDistributions = new Map();
    this.investmentPackages = new Map();
    this.systemConfigs = new Map();
    this.auditLogs = new Map();
    this.userBalances = new Map();
    this.depositRequests = new Map();
    this.userSharesHistory = new Map();
    this.businessTierConfigs = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Initialize with some sample data
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    // Initialize system updater for configurations
    let systemUpdater = 'system';
    
    // Create default admin user (only in development)
    if (process.env.NODE_ENV === 'development') {
      const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
      const hashedPassword = await hashPassword(adminPassword);
      
      const defaultAdmin: User = {
        id: 'admin-default-001',
        name: 'Admin',
        email: 'admin@phuan.com',
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        refCode: null,
        businessTier: null,
        investmentAmount: '0',
        totalShares: '0',
        maxoutReached: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(defaultAdmin.id, defaultAdmin);
      systemUpdater = defaultAdmin.id; // Use admin ID as updater in DEV
      console.log('✅ Created default admin user: admin@phuan.com (DEV mode)');
    }

    // Create sample branches
    const branch1 = await this.createBranch({
      name: "Chi nhánh Quận 1",
      address: "123 Nguyễn Huệ, Q1",
      monthlyRevenue: "890000",
      staffCount: 8
    });
    
    const branch2 = await this.createBranch({
      name: "Chi nhánh Quận 3", 
      address: "456 Nam Kỳ Khởi Nghĩa, Q3",
      monthlyRevenue: "720000",
      staffCount: 6
    });

    // Create sample staff with meaningful share holdings
    const staff1 = await this.createStaffMember({
      name: "Nguyễn Văn An",
      email: "nva@phuanduong.com",
      position: "Quản lý chi nhánh",
      branchId: branch1.id,
      equityPercentage: "5.2",
      shares: 250  // 250 shares = 250M VND value
    });

    const staff2 = await this.createStaffMember({
      name: "Trần Thị Bình",
      email: "ttb@phuanduong.com", 
      position: "Trưởng phòng KD",
      branchId: branch2.id,
      equityPercentage: "3.8",
      shares: 150  // 150 shares = 150M VND value
    });

    const staff3 = await this.createStaffMember({
      name: "Lê Minh Cường",
      email: "lmc@phuanduong.com", 
      position: "Chuyên viên cao cấp",
      branchId: branch1.id,
      equityPercentage: "2.1",
      shares: 100  // 100 shares = 100M VND value
    });

    const staff4 = await this.createStaffMember({
      name: "Phạm Thu Hoa",
      email: "pth@phuanduong.com", 
      position: "Nhân viên kinh doanh",
      branchId: branch2.id,
      equityPercentage: "1.2",
      shares: 50   // 50 shares = 50M VND value
    });

    // Create sample cards
    await this.createCard({
      cardNumber: "1234-5678-9012-3456",
      cardType: "Gold",
      customerName: "Nguyễn Văn A",
      price: "50000000", // 50M VND
      remainingSessions: 10,
      status: "active"
    });

    await this.createCard({
      cardNumber: "1234-5678-9012-7890",
      cardType: "Silver", 
      customerName: "Trần Thị B",
      price: "20000000", // 20M VND
      remainingSessions: 5,
      status: "active"
    });

    // Create sample transactions
    await this.createTransaction({
      type: "income",
      amount: "150000",
      description: "Thanh toán thẻ VIP",
      branchId: branch1.id,
      cardId: Array.from(this.cards.values())[0]?.id
    });

    await this.createTransaction({
      type: "expense",
      amount: "50000",
      description: "Chi phí vận hành",
      branchId: branch1.id,
      cardId: null
    });

    // Create sample KPI data
    await this.createKpi({
      branchId: branch1.id,
      period: "month",
      periodValue: "2024-11",
      cardSales: 15,
      cardSalesRevenue: "450000000", // 450M VND
      revisitRate: "85.5", // 85.5%
      deviceRevenue: "120000000", // 120M VND
      totalRevenue: "570000000",
      expenses: "200000000",
      kpiScore: "88.5" // 88.5% KPI score
    });

    await this.createKpi({
      branchId: branch2.id,
      period: "month",
      periodValue: "2024-11", 
      cardSales: 8,
      cardSalesRevenue: "240000000", // 240M VND
      revisitRate: "65.2", // 65.2% - below target
      deviceRevenue: "80000000", // 80M VND
      totalRevenue: "320000000",
      expenses: "150000000",
      kpiScore: "68.5" // 68.5% KPI score - below 70% threshold
    });

    // Create comprehensive staff KPIs for multiple quarters
    await this.createStaffKpi({
      staffId: staff1.id,
      period: "quarter",
      periodValue: "2024-Q3",
      cardSales: 15,
      customerRetention: "85.2",
      totalPoints: "160.2", // 15*5 + 85.2 = 160.2 points
      score: "85.0",
      slotsEarned: 3, // 160.2 / 50 = 3 slots
      sharesAwarded: "150", // 3 * 50 shares
      targetRevenue: "180000000", // 180M VND target
      bonusAmount: "8500000", // 8.5M VND bonus
      profitShareAmount: "12000000", // 12M VND profit share
      isProcessed: true
    });

    await this.createStaffKpi({
      staffId: staff1.id,
      period: "quarter", 
      periodValue: "2024-Q4",
      cardSales: 18,
      customerRetention: "88.7",
      totalPoints: "178.7", // 18*5 + 88.7 = 178.7 points
      score: "92.0",
      slotsEarned: 3, // 178.7 / 50 = 3 slots
      sharesAwarded: "150", // 3 * 50 shares
      targetRevenue: "200000000", // 200M VND target
      bonusAmount: "12000000", // 12M VND bonus
      profitShareAmount: "15000000", // 15M VND profit share
      isProcessed: false
    });

    await this.createStaffKpi({
      staffId: staff2.id,
      period: "quarter",
      periodValue: "2024-Q3",
      cardSales: 8,
      customerRetention: "72.3",
      totalPoints: "112.3", // 8*5 + 72.3 = 112.3 points
      score: "75.0",
      slotsEarned: 2, // 112.3 / 50 = 2 slots
      sharesAwarded: "100", // 2 * 50 shares
      targetRevenue: "120000000", // 120M VND target
      bonusAmount: "5500000", // 5.5M VND bonus
      profitShareAmount: "8000000", // 8M VND profit share
      isProcessed: true
    });

    await this.createStaffKpi({
      staffId: staff2.id,
      period: "quarter",
      periodValue: "2024-Q4",
      cardSales: 10,
      customerRetention: "78.9",
      totalPoints: "128.9", // 10*5 + 78.9 = 128.9 points
      score: "82.0", 
      slotsEarned: 2, // 128.9 / 50 = 2 slots
      sharesAwarded: "100", // 2 * 50 shares
      targetRevenue: "140000000", // 140M VND target
      bonusAmount: "7200000", // 7.2M VND bonus
      profitShareAmount: "10000000", // 10M VND profit share
      isProcessed: false
    });

    await this.createStaffKpi({
      staffId: staff3.id,
      period: "quarter",
      periodValue: "2024-Q4",
      cardSales: 12,
      customerRetention: "65.4",
      totalPoints: "125.4", // 12*5 + 65.4 = 125.4 points
      score: "78.5",
      slotsEarned: 2, // 125.4 / 50 = 2 slots
      sharesAwarded: "100", // 2 * 50 shares
      targetRevenue: "100000000", // 100M VND target
      bonusAmount: "6000000", // 6M VND bonus
      profitShareAmount: "7500000", // 7.5M VND profit share
      isProcessed: false
    });

    await this.createStaffKpi({
      staffId: staff4.id,
      period: "quarter",
      periodValue: "2024-Q4", 
      cardSales: 6,
      customerRetention: "42.1",
      totalPoints: "72.1", // 6*5 + 42.1 = 72.1 points
      score: "65.0",
      slotsEarned: 1, // 72.1 / 50 = 1 slot
      sharesAwarded: "50", // 1 * 50 shares  
      targetRevenue: "80000000", // 80M VND target
      bonusAmount: "3200000", // 3.2M VND bonus
      profitShareAmount: "4000000", // 4M VND profit share
      isProcessed: false
    });

    // Create sample referrals with enhanced data
    const referralCode1 = await this.generateReferralCode(staff1.id);
    await this.createReferral({
      referrerId: staff1.id,
      referredUserId: null, // Not yet assigned
      referralCode: referralCode1,
      customerName: "Nguyễn Thanh Long",
      firstTransactionId: null,
      contributionValue: "45000000", // 45M VND first transaction
      commissionRate: "8.0",
      commissionAmount: "3600000", // 8% of 45M = 3.6M VND
      commissionPaid: "0",
      status: "pending"
    });

    const referralCode2 = await this.generateReferralCode(staff2.id);
    await this.createReferral({
      referrerId: staff2.id,
      referredUserId: null,
      referralCode: referralCode2,
      customerName: "Trần Văn Khoa",
      firstTransactionId: null,
      contributionValue: "30000000", // 30M VND first transaction
      commissionRate: "8.0",
      commissionAmount: "2400000", // 8% of 30M = 2.4M VND
      commissionPaid: "2400000", // Already paid
      status: "completed"
    });

    const referralCode3 = await this.generateReferralCode(staff3.id);
    await this.createReferral({
      referrerId: staff3.id,
      referredUserId: null,
      referralCode: referralCode3,
      customerName: "Lê Thị Mai",
      firstTransactionId: null,
      contributionValue: "20000000", // 20M VND first transaction
      commissionRate: "8.0",
      commissionAmount: "1600000", // 8% of 20M = 1.6M VND
      commissionPaid: "800000", // Partially paid
      status: "pending"
    });

    // Update staff timestamps to show recent activity
    await this.updateStaffMember(staff1.id, { updatedAt: new Date() });
    await this.updateStaffMember(staff2.id, { updatedAt: new Date(Date.now() - 86400000) }); // 1 day ago
    await this.updateStaffMember(staff3.id, { updatedAt: new Date(Date.now() - 172800000) }); // 2 days ago  
    await this.updateStaffMember(staff4.id, { updatedAt: new Date(Date.now() - 259200000) }); // 3 days ago

    // Initialize default system configurations
    await this.updateSystemConfig("maxout_limit_percentage", "210", "Maximum payout limit as percentage of card price", systemUpdater);
    await this.updateSystemConfig("kpi_threshold_points", "50", "Minimum KPI points required per quarter for shares", systemUpdater);
    await this.updateSystemConfig("profit_share_rate", "49", "Percentage of quarterly profit distributed to shareholders", systemUpdater);
    await this.updateSystemConfig("withdrawal_minimum", "5000000", "Minimum withdrawal amount in VND", systemUpdater);
    await this.updateSystemConfig("withdrawal_tax_rate", "10", "Tax rate percentage for withdrawals over 10M VND", systemUpdater);
    await this.updateSystemConfig("corporate_tax_rate", "20", "Corporate tax rate percentage on gross profit", systemUpdater);
    await this.updateSystemConfig("referral_commission_rate", "8", "Referral commission rate percentage", systemUpdater);
    await this.updateSystemConfig("shares_per_slot", "50", "Number of shares awarded per slot", systemUpdater);
    
    // Initialize business tier configs
    await this.createBusinessTierConfig({
      tierName: 'founder',
      minInvestmentAmount: '245000000',
      shareMultiplier: '1.0',
      maxShares: null,
      description: 'Founder tier - unlimited shares for investments ≥245M VND',
      benefits: 'Unlimited shares, highest profit sharing percentage, voting rights',
    });

    await this.createBusinessTierConfig({
      tierName: 'angel',
      minInvestmentAmount: '100000000', 
      shareMultiplier: '1.0',
      maxShares: null,
      description: 'Angel tier - 1M VND = 1 share with 5x payout maxout',
      benefits: '5x investment payout cap, maxout protection, priority support',
    });

    await this.createBusinessTierConfig({
      tierName: 'branch',
      minInvestmentAmount: '0',
      shareMultiplier: '1.0', 
      maxShares: '200',
      description: 'Branch tier - maximum 200 shares based on KPI performance',
      benefits: 'KPI-based share allocation up to 200 shares, branch management access',
    });

    await this.createBusinessTierConfig({
      tierName: 'customer',
      minInvestmentAmount: '0',
      shareMultiplier: '1.0',
      maxShares: null,
      description: 'Card Customer - 1M VND = 1 share with 210% card price maxout',
      benefits: '210% card price payout cap, 5% VIP support, card-based benefits',
    });

    await this.createBusinessTierConfig({
      tierName: 'staff',
      minInvestmentAmount: '0',
      shareMultiplier: '1.0',
      maxShares: null,
      description: 'Staff - 50 points = 50 shares per quarter',
      benefits: 'Performance-based shares, quarterly rewards, internal access',
    });

    await this.createBusinessTierConfig({
      tierName: 'affiliate',
      minInvestmentAmount: '0',
      shareMultiplier: '0.0',
      maxShares: '0',
      description: 'Affiliate - 8% commission on referrals, no shares',
      benefits: '8% referral commission, no shares allocation',
    });
  }

  // User balance operations
  async getUserBalance(userId: string): Promise<UserBalance | undefined> {
    return this.userBalances.get(userId);
  }

  async createUserBalance(balance: InsertUserBalance): Promise<UserBalance> {
    const userBalance: UserBalance = {
      ...balance,
      createdAt: balance.createdAt || new Date(),
      updatedAt: balance.updatedAt || new Date(),
    };
    this.userBalances.set(balance.userId, userBalance);
    return userBalance;
  }

  async updateUserBalance(userId: string, balance: Partial<InsertUserBalance>): Promise<UserBalance | undefined> {
    const existingBalance = this.userBalances.get(userId);
    if (!existingBalance) return undefined;

    const updatedBalance = { ...existingBalance, ...balance, updatedAt: new Date() };
    this.userBalances.set(userId, updatedBalance);
    return updatedBalance;
  }

  async addToUserBalance(userId: string, amountVnd: number, description: string): Promise<UserBalance> {
    // Ensure we work with integer VND to avoid floating point errors
    const amountInteger = Math.floor(amountVnd);
    
    let balance = await this.getUserBalance(userId);
    
    if (!balance) {
      // Create new balance if it doesn't exist
      balance = await this.createUserBalance({
        userId,
        availableBalance: amountInteger.toString(),
        totalShares: "0",
        maxoutReached: false,
        description,
      });
    } else {
      // Update existing balance using integer arithmetic
      const currentBalance = Math.floor(parseFloat(balance.availableBalance || "0"));
      const newBalance = currentBalance + amountInteger;
      balance = await this.updateUserBalance(userId, {
        availableBalance: newBalance.toString(),
        description,
      });
    }
    
    return balance!;
  }

  // Deposit request operations
  async getDepositRequests(): Promise<DepositRequest[]> {
    return Array.from(this.depositRequests.values());
  }

  async getDepositRequest(id: string): Promise<DepositRequest | undefined> {
    return this.depositRequests.get(id);
  }

  async getUserDepositRequests(userId: string): Promise<DepositRequest[]> {
    return Array.from(this.depositRequests.values()).filter(
      request => request.userId === userId
    );
  }

  async createDepositRequest(request: InsertDepositRequest): Promise<DepositRequest> {
    const id = randomUUID();
    const depositRequest: DepositRequest = {
      ...request,
      id,
      status: request.status || 'pending',
      createdAt: request.createdAt || new Date(),
      updatedAt: request.updatedAt || new Date(),
    };
    this.depositRequests.set(id, depositRequest);
    return depositRequest;
  }

  async approveDepositRequest(requestId: string, approvedBy: string): Promise<DepositRequest | undefined> {
    const request = this.depositRequests.get(requestId);
    if (!request) return undefined;

    const updatedRequest = {
      ...request,
      status: 'approved' as const,
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    };
    this.depositRequests.set(requestId, updatedRequest);

    // Process the approved deposit - add to balance and update user tier/shares
    const user = await this.getUser(request.userId);
    if (user && request.amount) {
      const amount = parseFloat(request.amount);
      
      // Add to user balance
      await this.addToUserBalance(request.userId, amount, `Approved deposit request: ${request.businessTier}`);
      
      // Update user business tier and shares
      if (request.businessTier) {
        await this.upgradeUserBusinessTier(request.userId, request.businessTier, amount);
      }

      // Create shares history record
      const shareAmount = await this.calculateUserShares(request.userId, amount);
      await this.createUserSharesHistory({
        userId: request.userId,
        changeAmount: shareAmount.toString(),
        changeType: 'deposit',
        description: `Deposit approved: ${request.businessTier} tier`,
        transactionId: requestId,
      });
    }

    return updatedRequest;
  }

  async rejectDepositRequest(requestId: string, approvedBy: string, reason: string): Promise<DepositRequest | undefined> {
    const request = this.depositRequests.get(requestId);
    if (!request) return undefined;

    const updatedRequest = {
      ...request,
      status: 'rejected' as const,
      approvedBy,
      approvedAt: new Date(),
      notes: reason,
      updatedAt: new Date(),
    };
    this.depositRequests.set(requestId, updatedRequest);
    return updatedRequest;
  }

  // User shares history operations
  async getUserSharesHistory(userId: string): Promise<UserSharesHistory[]> {
    return Array.from(this.userSharesHistory.values()).filter(
      history => history.userId === userId
    );
  }

  async createUserSharesHistory(history: InsertUserSharesHistory): Promise<UserSharesHistory> {
    const id = randomUUID();
    const sharesHistory: UserSharesHistory = {
      ...history,
      id,
      timestamp: history.timestamp || new Date(),
    };
    this.userSharesHistory.set(id, sharesHistory);
    return sharesHistory;
  }

  // Business tier config operations
  async getBusinessTierConfigs(): Promise<BusinessTierConfig[]> {
    return Array.from(this.businessTierConfigs.values());
  }

  async getBusinessTierConfig(tierName: string): Promise<BusinessTierConfig | undefined> {
    return this.businessTierConfigs.get(tierName);
  }

  async createBusinessTierConfig(config: InsertBusinessTierConfig): Promise<BusinessTierConfig> {
    const businessTierConfig: BusinessTierConfig = {
      ...config,
      createdAt: config.createdAt || new Date(),
      updatedAt: config.updatedAt || new Date(),
    };
    this.businessTierConfigs.set(config.tierName, businessTierConfig);
    return businessTierConfig;
  }

  async updateBusinessTierConfig(tierName: string, config: Partial<InsertBusinessTierConfig>): Promise<BusinessTierConfig | undefined> {
    const existingConfig = this.businessTierConfigs.get(tierName);
    if (!existingConfig) return undefined
