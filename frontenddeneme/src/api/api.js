import axiosClient from './axiosClient';

export const getDashboardSummary = () => axiosClient.get('/dashboard/summary');
export const getFraudCases = (skip = 0, limit = 100) => axiosClient.get(`/fraud-cases?skip=${skip}&limit=${limit}`);
export const getRiskRules = () => axiosClient.get('/risk-rules');
export const createRiskRule = (ruleData) => axiosClient.post('/risk-rules', ruleData);
export const updateRiskRule = (ruleId, ruleData) => axiosClient.put(`/risk-rules/${ruleId}`, ruleData);
export const deleteRiskRule = (ruleId) => axiosClient.delete(`/risk-rules/${ruleId}`);
export const getRiskProfile = (userId) => axiosClient.get(`/users/${userId}/risk-profile`);
export const getRiskProfiles = (riskLevel = null) => {
    let url = '/risk-profiles';
    if (riskLevel) url += `?risk_level=${encodeURIComponent(riskLevel)}`;
    return axiosClient.get(url);
};
export const getEvents = (skip = 0, limit = 100, startTime = null, service = null, sortBy = null, userId = null) => {
    let url = `/events?skip=${skip}&limit=${limit}`;
    if (startTime) url += `&start_time=${encodeURIComponent(startTime)}`;
    if (service) url += `&service=${encodeURIComponent(service)}`;
    if (sortBy) url += `&sort_by=${encodeURIComponent(sortBy)}`;
    if (userId) url += `&user_id=${encodeURIComponent(userId)}`;
    return axiosClient.get(url);
};
export const getDecisions = (skip = 0, limit = 100, action = null, userId = null) => {
    let url = `/decisions?skip=${skip}&limit=${limit}`;
    if (action) url += `&action=${encodeURIComponent(action)}`;
    if (userId) url += `&user_id=${encodeURIComponent(userId)}`;
    return axiosClient.get(url);
};
