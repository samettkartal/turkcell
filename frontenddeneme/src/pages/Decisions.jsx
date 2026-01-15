import React, { useEffect, useState } from 'react';
import { getDecisions } from '../api/api';

const Decisions = () => {
    const [decisions, setDecisions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDecisions = async () => {
            try {
                const response = await getDecisions();
                setDecisions(response.data);
            } catch (error) {
                console.error("Failed to fetch decisions", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDecisions();
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-gray-900">System Decisions</h1>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Decision ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selected Action</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Triggered Rules</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suppressed Actions</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="6" className="p-4 text-center">Loading...</td></tr>
                        ) : decisions.length === 0 ? (
                            <tr><td colSpan="6" className="p-4 text-center text-gray-500">No decisions found.</td></tr>
                        ) : decisions.map((row) => (
                            <tr key={row.decision_id || Math.random()} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" title={row.decision_id}>{row.decision_id ? row.decision_id.substring(0, 8) + '...' : '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.user_id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${row.selected_action === 'BLOCK' ? 'bg-red-100 text-red-800' :
                                        row.selected_action === 'ALERT' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                        {row.selected_action}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {row.triggered_rules ? (
                                        <div className="flex flex-wrap gap-1">
                                            {row.triggered_rules.split(',').map((rule, i) => (
                                                <span key={i} className="px-2 py-0.5 rounded text-xs font-mono bg-blue-50 text-blue-700 border border-blue-100">
                                                    {rule}
                                                </span>
                                            ))}
                                        </div>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-400">
                                    {row.suppressed_actions ? (
                                        <div className="flex gap-1">
                                            {row.suppressed_actions.split(',').map((act, i) => (
                                                <span key={i} className="line-through decoration-gray-400 text-xs border border-gray-200 px-1 rounded bg-gray-50">
                                                    {act}
                                                </span>
                                            ))}
                                        </div>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(row.timestamp).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Decisions;
