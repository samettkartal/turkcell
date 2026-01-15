import React, { useEffect, useState } from 'react';
import { getFraudCases } from '../api/api';

const FraudCases = () => {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getFraudCases();
                setCases(response.data);
            } catch (error) {
                console.error("Failed to fetch cases", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Fraud Cases</h1>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trigger Action</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opened At</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="6" className="p-4 text-center">Loading...</td></tr>
                        ) : cases.map((row) => (
                            <tr key={row.case_id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{row.case_id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.user_id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold border border-gray-200">
                                        {row.triggering_action || '-'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${row.status === 'OPEN' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                        {row.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.priority}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(row.opened_at).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FraudCases;
