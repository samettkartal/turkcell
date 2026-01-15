import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Loader, AlertTriangle, CheckCircle, Shield, X, Activity, User } from 'lucide-react';
import { getRiskProfile, getDecisions, getRiskProfiles } from '../api/api';

const UserProfile = () => {
    const [searchParams] = useSearchParams();
    const [userId, setUserId] = useState('');
    const [profile, setProfile] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchedId, setSearchedId] = useState('');

    const [highRiskUsers, setHighRiskUsers] = useState([]);
    const [viewMode, setViewMode] = useState('single'); // 'single' | 'list'

    useEffect(() => {
        const filter = searchParams.get('filter');
        if (filter === 'HIGH') {
            fetchHighRiskUsers();
        }
    }, [searchParams]);

    const fetchHighRiskUsers = async () => {
        setLoading(true);
        setViewMode('list');
        try {
            const res = await getRiskProfiles('HIGH');
            setHighRiskUsers(res.data);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch high risk users.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!userId.trim()) return;
        performLookup(userId.trim());
    };

    const performLookup = async (uid) => {
        setLoading(true);
        setError(null);
        setSearchedId(uid);
        setProfile(null);
        setHistory([]);
        setViewMode('single');

        try {
            // 1. Get Profile
            try {
                const pRes = await getRiskProfile(uid);
                setProfile(pRes.data);
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    setError('User not found or no risk profile available yet.');
                } else {
                    setError('Failed to fetch profile.');
                }
            }

            // 2. Get History (Decisions)
            const hRes = await getDecisions(0, 50, null, uid);
            setHistory(hRes.data);

        } catch (err) {
            console.error(err);
            if (!error) setError('An error occurred during lookup.');
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (level) => {
        switch (level) {
            case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Shield className="mr-2 text-blue-600" /> User Lookup {viewMode === 'list' && '- High Risk Users'}
            </h2>

            {/* Search Bar */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Enter User ID (e.g. user_005)..."
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                        />
                        <Search className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Search'}
                    </button>
                    {viewMode === 'list' && (
                        <button
                            type="button"
                            onClick={() => setViewMode('single')}
                            className="px-4 py-3 text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </form>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center border border-red-100">
                    <AlertTriangle className="w-5 h-5 mr-2" /> {error}
                </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Score</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {highRiskUsers.map(u => (
                                <tr key={u.user_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 flex items-center">
                                        <User className="w-4 h-4 mr-2 text-gray-400" />
                                        {u.user_id}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{u.risk_score}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full border ${getRiskColor(u.risk_level)}`}>
                                            {u.risk_level}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => performLookup(u.user_id)}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {highRiskUsers.length === 0 && !loading && (
                                <tr><td colSpan="4" className="p-4 text-center text-gray-500">No high risk users found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Profile Card (Single View) */}
            {viewMode === 'single' && profile && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-700">Risk Profile</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskColor(profile.risk_level)}`}>
                                {profile.risk_level}
                            </span>
                        </div>

                        <div className="text-center py-6">
                            <div className="text-5xl font-extrabold text-blue-600 mb-2">{profile.risk_score}</div>
                            <div className="text-sm text-gray-500 uppercase tracking-wide">Risk Score</div>
                        </div>

                        {profile.signals && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <span className="text-xs font-semibold text-gray-400 uppercase block mb-2">Signals</span>
                                <div className="flex flex-wrap gap-2">
                                    {profile.signals.split(',').map((sig, i) => (
                                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                            {sig.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Logs (Decisions) */}
                    <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <h3 className="font-bold text-gray-700 mb-4 flex items-center">
                            <Activity className="w-4 h-4 mr-2" /> Recent Actions Log for {searchedId}
                        </h3>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event ID</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Signals (Reasons)</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result / Penalty</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {history.length === 0 ? (
                                        <tr><td colSpan="4" className="p-4 text-center text-sm text-gray-500">No logs found for this user.</td></tr>
                                    ) : (
                                        history.map((dec) => (
                                            <tr key={dec.decision_id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-xs text-gray-500 font-mono whitespace-nowrap">
                                                    {dec.event_id ? dec.event_id.substring(0, 8) + '...' : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                                                    {new Date(dec.timestamp).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {dec.signals ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {dec.signals.split(',').map((sig, i) => (
                                                                <span key={i} className="inline-block bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs border border-gray-200">
                                                                    {sig.trim()}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : <span className="text-gray-400 text-xs italic">Generic Risk</span>}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                        ${dec.selected_action === 'BLOCK' ? 'bg-red-100 text-red-800' :
                                                            dec.selected_action === 'ALLOW' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                                        {dec.selected_action}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
