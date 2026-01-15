import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardSummary, getEvents } from '../api/api';
import { Activity, Shield, AlertTriangle, Users, Clock } from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await getDashboardSummary();
                setStats(response.data);
            } catch (error) {
                console.error("Failed to fetch stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats(); // Initial fetch
        const interval = setInterval(fetchStats, 5000); // Poll every 5s

        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="p-10 text-center text-blue-600 font-semibold">Loading TrustShield Dashboard...</div>;
    if (!stats) return <div className="p-10 text-center text-red-500">Error loading system data.</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Shield className="mr-3 text-blue-600" /> TrustShield Command Center
            </h1>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Events"
                    value={stats.total_events}
                    icon={<Activity />}
                    color="bg-blue-600"
                    onClick={() => { }} // No specific link
                />
                <StatCard
                    title="Active Rules"
                    value={stats.active_risk_rules}
                    icon={<AlertTriangle />}
                    color="bg-emerald-500"
                    onClick={() => navigate('/rules')}
                    clickable
                />
                <StatCard
                    title="Open Fraud Cases"
                    value={stats.open_fraud_cases}
                    icon={<Shield />}
                    color="bg-amber-500"
                    onClick={() => navigate('/cases')}
                    clickable
                />
                <StatCard
                    title="High Risk Users"
                    value={stats.high_risk_users}
                    icon={<Users />}
                    color="bg-red-600"
                    onClick={() => navigate('/profile-check?filter=HIGH')}
                    clickable
                />
            </div>

            {/* Row 1: Traffic Area & Risk Pie */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Area Chart: Traffic */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-blue-500" /> Real-time Event Traffic (24h)
                    </h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.traffic_24h}>
                                <defs>
                                    <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="events" stroke="#3B82F6" fillOpacity={1} fill="url(#colorEvents)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart: Risk Distribution */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">User Risk Distribution</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.risk_distribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.risk_distribution?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Row 2: Service Bar & Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart: Service Based Risks */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Activity by Service</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.service_stats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="events" fill="#E5E7EB" radius={[4, 4, 0, 0]} name="Total Events" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Custom Heatmap: Weekly Risk Intensity */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-red-500" /> Weekly Risk Heatmap
                    </h3>
                    <div className="flex flex-col space-y-2">
                        {/* Header Row */}
                        <div className="flex text-xs text-gray-400 justify-between px-2">
                            <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:59</span>
                        </div>

                        {/* Rows */}
                        {stats.weekly_heatmap?.map((d, i) => (
                            <div key={d.day} className="flex items-center">
                                <span className="w-8 text-xs font-semibold text-gray-500">{d.day}</span>
                                <div className="flex-1 flex space-x-1">
                                    {d.values.map((v, j) => (
                                        <div
                                            key={j}
                                            className={`h-6 flex-1 rounded-sm transition hover:scale-110 cursor-pointer text-transparent hover:text-white text-[10px] flex items-center justify-center
                                                ${v > 5 ? 'bg-red-600' :
                                                    v > 3 ? 'bg-red-400' :
                                                        v > 1 ? 'bg-orange-300' :
                                                            v > 0 ? 'bg-green-200' : 'bg-green-50'}`}
                                            title={`Events: ${v}`}
                                        >
                                            {v}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-end items-center space-x-2 text-xs text-gray-500">
                        <span>Low</span>
                        <div className="w-16 h-2 bg-gradient-to-r from-green-50 via-orange-300 to-red-600 rounded-full"></div>
                        <span>Critical</span>
                    </div>
                </div>
            </div>

            {/* Recent Transactions Section */}
            <RecentTransactions />
        </div>
    );
};

// Recent Transactions Component
const RecentTransactions = () => {
    const [events, setEvents] = useState([]);
    const [timeFilter, setTimeFilter] = useState('24H');
    const [serviceFilter, setServiceFilter] = useState('ALL');
    const [sortFilter, setSortFilter] = useState('timestamp_desc');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            // Only set loading on initial fetch to avoid flickering
            try {
                // Calculate start time
                const now = new Date();
                let past = new Date();

                switch (timeFilter) {
                    case '6H': past.setHours(now.getHours() - 6); break;
                    case '12H': past.setHours(now.getHours() - 12); break;
                    case '24H': past.setHours(now.getHours() - 24); break;
                    case '1W': past.setDate(now.getDate() - 7); break;
                    case '1M': past.setMonth(now.getMonth() - 1); break;
                    default: past.setHours(now.getHours() - 24);
                }

                const isoTime = past.toISOString();
                // Pass filters to API
                const response = await getEvents(0, 50, isoTime, serviceFilter, sortFilter);
                setEvents(response.data);
            } catch (error) {
                console.error("Failed to fetch events", error);
            } finally {
                setLoading(false);
            }
        };

        setLoading(true);
        fetchEvents();
        const interval = setInterval(fetchEvents, 5000);
        return () => clearInterval(interval);
    }, [timeFilter, serviceFilter, sortFilter]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-blue-600" /> Recent Transactions
                </h3>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Time Filter */}
                    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                        {['6H', '12H', '24H', '1W'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setTimeFilter(f)}
                                className={`px-2 py-1 text-xs font-semibold rounded-md transition ${timeFilter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* Service Filter */}
                    <select
                        value={serviceFilter}
                        onChange={(e) => setServiceFilter(e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg p-1.5 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="ALL">All Services</option>
                        <option value="PAYCELL">Paycell</option>
                        <option value="TV+">TV+</option>
                        <option value="BIP">BIP</option>
                        <option value="SUPERONLINE">SuperOnline</option>
                    </select>

                    {/* Sort Filter */}
                    <select
                        value={sortFilter}
                        onChange={(e) => setSortFilter(e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg p-1.5 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="timestamp_desc">Newest First</option>
                        <option value="value_desc">Highest Value (Important)</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event ID</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="4" className="p-4 text-center text-gray-500">Loading transactions...</td></tr>
                        ) : events.length === 0 ? (
                            <tr><td colSpan="4" className="p-4 text-center text-gray-500">No transactions found in this period.</td></tr>
                        ) : events.map((evt) => (
                            <tr key={evt.event_id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-blue-600">{evt.user_id}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{evt.service}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-mono text-gray-600 cursor-pointer hover:text-blue-600" title={evt.event_id}>{evt.event_id.substring(0, 8)}...</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{new Date(evt.timestamp).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Stateless Components
const StatCard = ({ title, value, icon, color, onClick, clickable }) => (
    <div
        onClick={onClick}
        className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between transition 
        ${clickable ? 'hover:shadow-md cursor-pointer hover:bg-gray-50' : ''}`}
    >
        <div>
            <p className="text-gray-500 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-4 rounded-xl text-white ${color} shadow-lg shadow-${color}/30 transform rotate-3`}>
            {React.cloneElement(icon, { size: 28 })}
        </div>
    </div>
);

export default Dashboard;
