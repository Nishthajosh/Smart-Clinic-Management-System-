"use client";

import { useState, useEffect } from "react";
import {
  getAnalyticsData,
  getAlerts,
  exportData,
  importData,
  exportDataAsCSV,
  importDataFromCSV,
} from "../../utils/localStorageUtils";
import { runPatternDetection } from "../../utils/patternDetection";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCSVImportModal, setShowCSVImportModal] = useState(false);
  const [importDataText, setImportDataText] = useState("");
  const [importCSVDataText, setImportCSVDataText] = useState("");
  const [importFormat, setImportFormat] = useState<"json" | "csv">("json");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [monthSymptoms, setMonthSymptoms] = useState<
    { symptom: string; count: number }[]
  >([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (analytics && selectedMonth) {
      // Find all visits in the selected month
      const patients = JSON.parse(
        localStorage.getItem("health_patients") || "[]"
      );
      const allVisits = patients.flatMap((p: any) => p.visits);
      const monthVisits = allVisits.filter((visit: any) => {
        const month = new Date(visit.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        });
        return month === selectedMonth;
      });
      // Count symptoms
      const symptomCounts: { [key: string]: number } = {};
      monthVisits.forEach((visit: any) => {
        visit.symptoms.forEach((symptom: string) => {
          symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
        });
      });
      const sorted = Object.entries(symptomCounts)
        .map(([symptom, count]) => ({ symptom, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      setMonthSymptoms(sorted);
    } else {
      setMonthSymptoms([]);
    }
  }, [analytics, selectedMonth]);

  const loadData = () => {
    const analyticsData = getAnalyticsData();
    const alertsData = getAlerts();

    setAnalytics(analyticsData);
    setAlerts(alertsData);
    setLoading(false);

    // Run pattern detection
    runPatternDetection();
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `patient-data-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCSVExport = () => {
    const data = exportDataAsCSV();
    const blob = new Blob([data], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `patient-data-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (importData(importDataText)) {
      alert("Data imported successfully!");
      setShowImportModal(false);
      setImportDataText("");
      loadData();
    } else {
      alert("Failed to import data. Please check the format.");
    }
  };

  const handleCSVImport = () => {
    if (importDataFromCSV(importCSVDataText)) {
      alert("CSV data imported successfully!");
      setShowCSVImportModal(false);
      setImportCSVDataText("");
      loadData();
    } else {
      alert("Failed to import CSV data. Please check the format.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Chart configurations
  const symptomsChartData = {
    labels:
      analytics?.commonSymptoms.slice(0, 8).map((item: any) => item.symptom) ||
      [],
    datasets: [
      {
        label: "Occurrences",
        data:
          analytics?.commonSymptoms
            .slice(0, 8)
            .map((item: any) => item.count) || [],
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  };

  const diagnosesChartData = {
    labels:
      analytics?.commonDiagnoses
        .slice(0, 8)
        .map((item: any) => item.diagnosis) || [],
    datasets: [
      {
        label: "Occurrences",
        data:
          analytics?.commonDiagnoses
            .slice(0, 8)
            .map((item: any) => item.count) || [],
        backgroundColor: "rgba(16, 185, 129, 0.8)",
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 1,
      },
    ],
  };

  const severityChartData = {
    labels:
      analytics?.severityDistribution.map((item: any) => item.severity) || [],
    datasets: [
      {
        data:
          analytics?.severityDistribution.map((item: any) => item.count) || [],
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)",
          "rgba(234, 179, 8, 0.8)",
          "rgba(239, 68, 68, 0.8)",
        ],
        borderColor: [
          "rgba(34, 197, 94, 1)",
          "rgba(234, 179, 8, 1)",
          "rgba(239, 68, 68, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const visitFrequencyData = {
    labels: analytics?.visitFrequency.map((item: any) => item.month) || [],
    datasets: [
      {
        label: "Visits",
        data: analytics?.visitFrequency.map((item: any) => item.count) || [],
        fill: false,
        borderColor: "rgba(147, 51, 234, 1)",
        backgroundColor: "rgba(147, 51, 234, 0.1)",
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Analytics Dashboard
            </h1>
            <p className="mt-2 text-gray-600">
              Data insights and trends from your patient records
            </p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Export JSON
            </button>
            <button
              onClick={handleCSVExport}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Export CSV
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Import JSON
            </button>
            <button
              onClick={() => setShowCSVImportModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Import CSV
            </button>
            <button
              onClick={loadData}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">👥</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Total Patients
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {analytics?.totalPatients || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">🏥</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Visits</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analytics?.totalVisits || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Avg Healing Days
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {analytics?.averageHealingDuration
                  ? Math.round(analytics.averageHealingDuration)
                  : 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">⚠️</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Alerts</p>
              <p className="text-2xl font-semibold text-gray-900">
                {alerts.filter((a: any) => !a.isRead).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Common Symptoms */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Most Common Symptoms
          </h3>
          <div className="h-64">
            <Bar data={symptomsChartData} options={chartOptions} />
          </div>
        </div>

        {/* Common Diagnoses */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Most Common Diagnoses
          </h3>
          <div className="h-64">
            <Bar data={diagnosesChartData} options={chartOptions} />
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Severity Distribution
          </h3>
          <div className="h-64 flex items-center justify-center">
            <div className="w-48 h-48">
              <Doughnut data={severityChartData} options={doughnutOptions} />
            </div>
          </div>
        </div>

        {/* Visit Frequency */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Visit Frequency Over Time
          </h3>
          <div className="h-64">
            <Line data={visitFrequencyData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Month-wise Visits Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Number of Visits Month-wise
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Number of Visits
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics?.visitFrequency.map((item: any) => (
                <tr key={item.month}>
                  <td className="px-4 py-2 whitespace-nowrap">{item.month}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Most Occurring Symptoms in a Month */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Most Occurring Symptoms in a Month
          </h3>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Month</option>
            {analytics?.visitFrequency.map((item: any) => (
              <option key={item.month} value={item.month}>
                {item.month}
              </option>
            ))}
          </select>
        </div>
        <div className="h-64">
          <Bar
            data={{
              labels: monthSymptoms.map((item) => item.symptom),
              datasets: [
                {
                  label: "Occurrences",
                  data: monthSymptoms.map((item) => item.count),
                  backgroundColor: "rgba(59, 130, 246, 0.8)",
                  borderColor: "rgba(59, 130, 246, 1)",
                  borderWidth: 1,
                },
              ],
            }}
            options={chartOptions}
          />
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Recent Pattern Alerts
          </h3>
        </div>
        <div className="p-6">
          {alerts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No alerts generated yet
            </p>
          ) : (
            <div className="space-y-4">
              {alerts.slice(0, 10).map((alert: any) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.severity === "high"
                      ? "border-red-500 bg-red-50"
                      : alert.severity === "medium"
                      ? "border-yellow-500 bg-yellow-50"
                      : "border-blue-500 bg-blue-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {alert.message}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        alert.severity === "high"
                          ? "text-red-600 bg-red-100"
                          : alert.severity === "medium"
                          ? "text-yellow-600 bg-yellow-100"
                          : "text-blue-600 bg-blue-100"
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Import JSON Data
              </h3>
              <textarea
                value={importDataText}
                onChange={(e) => setImportDataText(e.target.value)}
                placeholder="Paste your JSON data here..."
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex space-x-4 mt-4">
                <button
                  onClick={handleImport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Import
                </button>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportDataText("");
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCSVImportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Import CSV Data
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Paste CSV data with headers: Patient ID, Patient Name, Age,
                Gender, Contact Info, Visit ID, Visit Date, Symptoms, Diagnosis,
                Treatment, Severity, Healing Duration (days), Notes, Visit
                Created At, Patient Created At, Patient Updated At
              </p>
              <textarea
                value={importCSVDataText}
                onChange={(e) => setImportCSVDataText(e.target.value)}
                placeholder="Paste your CSV data here..."
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex space-x-4 mt-4">
                <button
                  onClick={handleCSVImport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Import
                </button>
                <button
                  onClick={() => {
                    setShowCSVImportModal(false);
                    setImportCSVDataText("");
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
