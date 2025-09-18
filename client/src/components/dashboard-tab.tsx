import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect, useRef } from "react";

// Chart.js types
declare global {
  interface Window {
    Chart: any;
  }
}

interface BusinessOverview {
  quarterlyData: {
    labels: string[];
    revenue: number[];
    expenses: number[];
    profitAfterTax: number[];
  };
  cardMaxoutStatus: Array<{
    type: string;
    current: number;
    max: number;
    percentage: number;
  }>;
  profitAllocation: {
    roles: number;
    operations: number;
    expansion: number;
  };
  alerts: Array<{
    type: string;
    message: string;
    severity: string;
  }>;
  topBranches: Array<{
    rank: number;
    name: string;
    score: number;
    kpi: number;
  }>;
}

export default function DashboardTab() {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  const { data: metrics, isLoading: metricsLoading } = useQuery<{totalRevenue: string, activeCards: number, branches: number, staff: number}>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: businessData, isLoading: businessLoading } = useQuery<BusinessOverview>({
    queryKey: ["/api/dashboard/business-overview"],
  });

  useEffect(() => {
    if (businessData && chartRef.current && window.Chart) {
      // Destroy existing chart
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      chartInstance.current = new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels: businessData.quarterlyData.labels,
          datasets: [
            {
              label: 'Doanh thu',
              data: businessData.quarterlyData.revenue,
              backgroundColor: '#43B0A5',
              borderRadius: 4,
            },
            {
              label: 'Chi phí', 
              data: businessData.quarterlyData.expenses,
              backgroundColor: '#ffc107',
              borderRadius: 4,
            },
            {
              label: 'Lợi nhuận sau thuế',
              data: businessData.quarterlyData.profitAfterTax,
              backgroundColor: '#28a745',
              borderRadius: 4,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top' as const,
            },
            title: {
              display: true,
              text: 'Báo cáo tài chính theo quý (USD)'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value: any) {
                  return '$' + value;
                }
              }
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [businessData]);

  // Load Chart.js dynamically
  useEffect(() => {
    if (!window.Chart) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  if (metricsLoading || businessLoading) {
    return (
      <div className="row">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="col-12 col-md-6 col-xl-4">
            <Card className="metric-card mb-3">
              <CardContent className="p-4">
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-16" />
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  const getProgressVariant = (percentage: number) => {
    if (percentage >= 85) return 'bg-danger';
    if (percentage >= 70) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <div>
      {/* Alerts Section */}
      {businessData?.alerts && businessData.alerts.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            {businessData.alerts.map((alert, index) => (
              <Alert 
                key={index} 
                className={`mb-2 alert-${alert.type}`} 
                data-testid={`alert-${index}`}
              >
                <AlertDescription>
                  <i className={`bi ${alert.type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-exclamation-circle-fill'} me-2`}></i>
                  {alert.message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="row mb-4">
        <div className="col-12 col-md-6 col-xl-3">
          <div className="metric-card">
            <div className="metric-value" data-testid="metric-revenue">{metrics?.totalRevenue || "0"}₫</div>
            <div className="metric-label">Doanh thu tháng</div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <div className="metric-card">
            <div className="metric-value" data-testid="metric-cards">{metrics?.activeCards || 0}</div>
            <div className="metric-label">Thẻ đang hoạt động</div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <div className="metric-card">
            <div className="metric-value" data-testid="metric-branches">{metrics?.branches || 0}</div>
            <div className="metric-label">Chi nhánh</div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <div className="metric-card">
            <div className="metric-value" data-testid="metric-staff">{metrics?.staff || 0}</div>
            <div className="metric-label">Nhân viên</div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Financial Chart */}
        <div className="col-12 col-xl-8 mb-4">
          <Card>
            <CardHeader>
              <h5 className="mb-0">Báo cáo tài chính theo quý</h5>
            </CardHeader>
            <CardContent>
              <div className="chart-container" style={{ position: "relative", height: "350px" }}>
                <canvas ref={chartRef} data-testid="financial-chart"></canvas>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profit Allocation */}
        <div className="col-12 col-xl-4 mb-4">
          <Card>
            <CardHeader>
              <h5 className="mb-0">Phân bổ lợi nhuận</h5>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-3">
                <div className="display-4 fw-bold" style={{ color: '#43B0A5' }} data-testid="profit-allocation-roles">
                  {businessData?.profitAllocation.roles}%
                </div>
                <div className="text-muted">Phân bổ cho vai trò</div>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-2">
                <span>Vận hành:</span>
                <span className="fw-bold">{businessData?.profitAllocation.operations}%</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Mở rộng:</span>
                <span className="fw-bold">{businessData?.profitAllocation.expansion}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="row">
        {/* Card Maxout Status */}
        <div className="col-12 col-lg-6 mb-4">
          <Card>
            <CardHeader>
              <h5 className="mb-0">Trạng thái giới hạn thẻ</h5>
            </CardHeader>
            <CardContent>
              {businessData?.cardMaxoutStatus.map((card, index) => (
                <div key={index} className="mb-3" data-testid={`card-maxout-${index}`}>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="fw-semibold">{card.type}</span>
                    <span className="text-muted">{card.current}/{card.max}</span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div
                      className={`progress-bar ${getProgressVariant(card.percentage)}`}
                      role="progressbar"
                      style={{ width: `${card.percentage}%` }}
                      aria-valuenow={card.percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    ></div>
                  </div>
                  <small className="text-muted">{card.percentage}% sử dụng</small>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Top Branches Ranking */}
        <div className="col-12 col-lg-6 mb-4">
          <Card>
            <CardHeader>
              <h5 className="mb-0">Bảng xếp hạng chi nhánh</h5>
            </CardHeader>
            <CardContent>
              <div className="table-responsive">
                <table className="table table-sm" data-testid="branches-ranking">
                  <thead>
                    <tr>
                      <th>Hạng</th>
                      <th>Chi nhánh</th>
                      <th>Điểm</th>
                      <th>KPI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businessData?.topBranches.map((branch) => (
                      <tr key={branch.rank} data-testid={`branch-rank-${branch.rank}`}>
                        <td>
                          <span className={`badge ${branch.rank === 1 ? 'bg-warning' : branch.rank === 2 ? 'bg-secondary' : 'bg-info'}`}>
                            #{branch.rank}
                          </span>
                        </td>
                        <td className="fw-semibold">{branch.name}</td>
                        <td>{branch.score}</td>
                        <td>
                          <span className={`badge ${branch.kpi >= 85 ? 'bg-success' : branch.kpi >= 70 ? 'bg-warning' : 'bg-danger'}`}>
                            {branch.kpi}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}