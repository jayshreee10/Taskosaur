import api from "@/lib/api";


export const orgChartsApi = {
  getKPIMetrics: async (orgId: string): Promise<any> => {
    try {
      const response = await api.get(`/organizations/${orgId}/charts/kpi-metrics`);
      return response.data;
    } catch (error) {
      console.error("Get KPI metrics error:", error);
      throw error;
    }
  },

  getProjectPortfolio: async (orgId: string): Promise<any> => {
    try {
      const response = await api.get(`/organizations/${orgId}/charts/project-portfolio`);
      return response.data;
    } catch (error) {
      console.error("Get project portfolio error:", error);
      throw error;
    }
  },

  getTeamUtilization: async (orgId: string): Promise<any> => {
    try {
      const response = await api.get(`/organizations/${orgId}/charts/team-utilization`);
      return response.data;
    } catch (error) {
      console.error("Get team utilization error:", error);
      throw error;
    }
  },

  getTaskDistribution: async (orgId: string): Promise<any> => {
    try {
      const response = await api.get(`/organizations/${orgId}/charts/task-distribution`);
      return response.data;
    } catch (error) {
      console.error("Get task distribution error:", error);
      throw error;
    }
  },

  getTaskTypeDistribution: async (orgId: string): Promise<any> => {
    try {
      const response = await api.get(`/organizations/${orgId}/charts/task-type`);
      return response.data;
    } catch (error) {
      console.error("Get task type distribution error:", error);
      throw error;
    }
  },

  getSprintMetrics: async (orgId: string): Promise<any> => {
    try {
      const response = await api.get(`/organizations/${orgId}/charts/sprint-metrics`);
      return response.data;
    } catch (error) {
      console.error("Get sprint metrics error:", error);
      throw error;
    }
  },

  getQualityMetrics: async (orgId: string): Promise<any> => {
    try {
      const response = await api.get(`/organizations/${orgId}/charts/quality-metrics`);
      return response.data;
    } catch (error) {
      console.error("Get quality metrics error:", error);
      throw error;
    }
  },

  getWorkspaceProjectCount: async (orgId: string): Promise<any> => {
    try {
      const response = await api.get(`/organizations/${orgId}/charts/workspace-project-count`);
      return response.data;
    } catch (error) {
      console.error("Get workspace project count error:", error);
      throw error;
    }
  },

  getMemberWorkload: async (orgId: string): Promise<any> => {
    try {
      const response = await api.get(`/organizations/${orgId}/charts/member-workload`);
      return response.data;
    } catch (error) {
      console.error("Get member workload error:", error);
      throw error;
    }
  },

  getResourceAllocation: async (orgId: string): Promise<any> => {
    try {
      const response = await api.get(`/organizations/${orgId}/charts/resource-allocation`);
      return response.data;
    } catch (error) {
      console.error("Get resource allocation error:", error);
      throw error;
    }
  },
};
