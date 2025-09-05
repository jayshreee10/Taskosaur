import { orgChartsApi } from "@/utils/api/orgChartsApi";
import React, { createContext, useContext, useEffect, useState } from "react";

interface DashboardData {
  kpiMetrics: any;
  projectPortfolio: any;
  teamUtilization: any;
  taskDistribution: any;
  taskTypeDistribution: any;
  sprintMetrics: any;
  qualityMetrics: any;
  workspaceProjectCount: any;
  memberWorkload: any;
  resourceAllocation: any;
}

interface DashboardContextType {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export const DashboardProvider = ({
  orgId,
  children,
}: {
  orgId: string;
  children: React.ReactNode;
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        kpiMetrics,
        projectPortfolio,
        teamUtilization,
        taskDistribution,
        taskTypeDistribution,
        sprintMetrics,
        qualityMetrics,
        workspaceProjectCount,
        memberWorkload,
        resourceAllocation,
      ] = await Promise.all([
        orgChartsApi.getKPIMetrics(orgId),
        orgChartsApi.getProjectPortfolio(orgId),
        orgChartsApi.getTeamUtilization(orgId),
        orgChartsApi.getTaskDistribution(orgId),
        orgChartsApi.getTaskTypeDistribution(orgId),
        orgChartsApi.getSprintMetrics(orgId),
        orgChartsApi.getQualityMetrics(orgId),
        orgChartsApi.getWorkspaceProjectCount(orgId),
        orgChartsApi.getMemberWorkload(orgId),
        orgChartsApi.getResourceAllocation(orgId),
      ]);

      setData({
        kpiMetrics,
        projectPortfolio,
        teamUtilization,
        taskDistribution,
        taskTypeDistribution,
        sprintMetrics,
        qualityMetrics,
        workspaceProjectCount,
        memberWorkload,
        resourceAllocation,
      });
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Auto fetch on mount
  useEffect(() => {
    fetchDashboardData();
  }, [orgId]);

  return (
    <DashboardContext.Provider
      value={{
        data,
        loading,
        error,
        refresh: fetchDashboardData,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

// ✅ Custom hook
export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};
