import React, { useEffect, useState } from 'react';
import { getTraceability } from '../api/api';
import { GitCommit, Search, Shield, FileText } from 'lucide-react';

const Traceability = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getTraceability();
                setLogs(response.data);
            } catch (error) {
                console.error("Failed to fetch traceability logs", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-gray-900 flex items-center">
                <GitCommit className="mr-2 text-indigo-600" /> ID Traceability
            </h1>
            <p className="mb-4 text-gray-600">Track the lifecycle of an event from ingestion to decision and potential fraud case creation.</p>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Decision ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan="5" className="p-4 text-center text-gray-500">No logs found.</td></tr>
                        ) : logs.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600" title={row.event_id}>
                                    <div className="flex items-center">
                                        <FileText className="w-3 h-3 mr-1 text-gray-400" />
                                        {row.event_id.substring(0, 8)}...
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-indigo-600" title={row.decision_id}>
                                    <div className="flex items-center">
                                        <Search className="w-3 h-3 mr-1 text-indigo-400" />
                                        {row.decision_id ? row.decision_id.substring(0, 8) + '...' : '-'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-red-600">
                                    {row.case_id ? (
                                        <div className="flex items-center bg-red-50 px-2 py-1 rounded w-fit border border-red-100">
                                            <Shield className="w-3 h-3 mr-1" />
                                            {row.case_id}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.user_id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(row.timestamp).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Traceability;
