import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { BsBuilding as Building, BsSpeedometer2 as Speedometer2, BsCreditCard as CreditCard, BsPeople as People, BsCashStack as CashStack, BsGear as Gear, BsBoxArrowRight as BoxArrowRight } from "react-icons/bs";
import DashboardTab from "@/components/dashboard-tab";
import CardsTab from "@/components/cards-tab";
import BranchesTab from "@/components/branches-tab";
import StaffEquityTab from "@/components/staff-equity-tab";
import CashFlowTab from "@/components/cash-flow-tab";
import AdminTab from "@/components/admin-tab";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const tabs = [
    { id: "dashboard", label: "Bảng điều khiển", icon: Speedometer2, component: DashboardTab },
    { id: "cards", label: "Thẻ & Ưu đãi", icon: CreditCard, component: CardsTab },
    { id: "branches", label: "Chi nhánh & KPI", icon: Building, component: BranchesTab },
    { id: "staff", label: "Nhân sự & Cổ phần", icon: People, component: StaffEquityTab },
    { id: "cashflow", label: "Dòng tiền & Giao dịch", icon: CashStack, component: CashFlowTab },
    { id: "admin", label: "Quản trị hệ thống", icon: Gear, component: AdminTab, adminOnly: true },
  ];

  const visibleTabs = tabs.filter(tab => !tab.adminOnly || user?.role === "admin");

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="navbar navbar-expand-lg bg-white border-bottom sticky-top">
        <div className="container-fluid">
          <a className="navbar-brand d-flex align-items-center" href="#" data-testid="navbar-brand">
            <Building className="me-2 text-primary" />
            <span style={{ color: "var(--primary-color)" }} className="fw-bold">Phúc An Đường</span>
          </a>
          <div className="d-flex align-items-center">
            <span className="me-3" data-testid="user-name">{user?.name}</span>
            <button 
              className="btn btn-outline-primary btn-sm" 
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <BoxArrowRight />
            </button>
          </div>
        </div>
      </nav>

      {/* Tab Navigation */}
      <div className="container-fluid mt-3">
        <ul className="nav nav-tabs" role="tablist" data-testid="main-tabs">
          {visibleTabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <li className="nav-item" role="presentation" key={tab.id}>
                <button
                  className={`nav-link ${activeTab === tab.id ? "active" : ""}`}
                  type="button"
                  role="tab"
                  onClick={() => setActiveTab(tab.id)}
                  data-testid={`tab-${tab.id}`}
                >
                  <IconComponent className="me-2" />
                  <span className="d-none d-md-inline">{tab.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Tab Content */}
        <div className="tab-content" id="mainTabContent">
          {visibleTabs.map((tab) => {
            const TabComponent = tab.component;
            return (
              <div
                key={tab.id}
                className={`tab-pane fade ${activeTab === tab.id ? "show active" : ""}`}
                role="tabpanel"
                data-testid={`tabpanel-${tab.id}`}
              >
                {activeTab === tab.id && <TabComponent />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
