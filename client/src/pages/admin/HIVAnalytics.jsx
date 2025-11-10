import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import {
  Activity,
  Users,
  MapPin,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import api from '../../utils/api';

const COLORS = {
  positive: '#EF4444', // red
  negative: '#10B981', // green
  accentBlue: '#3B82F6',
  accentIndigo: '#6366F1',
  age: ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4', '#84CC16'],
  gender: {
    positive: ['#1E40AF', '#3B82F6', '#8B5CF6', '#EC4899'],
    negative: ['#059669', '#10B981', '#34D399', '#6EE7B7']
  },
  location: [
    '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
    '#06B6D4', '#84CC16', '#F97316', '#6366F1', '#14B8A6',
    '#A855F7', '#EAB308', '#22C55E', '#F43F5E', '#0EA5E9'
  ]
};

const formatNumber = (n) => (typeof n === 'number' ? n.toLocaleString() : n);

const HIVAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/hiv/analytics');
      setAnalytics(response.analytics);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50 p-6">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50 p-6">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  // Prepare data for charts
  const ageData = Object.keys(analytics.byAge.positive).map((ageGroup) => ({
    name: ageGroup,
    positive: analytics.byAge.positive[ageGroup],
    negative: analytics.byAge.negative[ageGroup],
    total: analytics.byAge.positive[ageGroup] + analytics.byAge.negative[ageGroup]
  }));

  const genderPositiveData = Object.keys(analytics.byGender.positive)
    .filter(gender => analytics.byGender.positive[gender] > 0)
    .map((gender, idx) => ({
      name: gender,
      value: analytics.byGender.positive[gender],
      color: COLORS.gender.positive[idx % COLORS.gender.positive.length]
    }));

  const genderNegativeData = Object.keys(analytics.byGender.negative)
    .filter(gender => analytics.byGender.negative[gender] > 0)
    .map((gender, idx) => ({
      name: gender,
      value: analytics.byGender.negative[gender],
      color: COLORS.gender.negative[idx % COLORS.gender.negative.length]
    }));

  const locationData = Object.keys(analytics.byLocation.positive)
    .map((location) => ({
      name: location,
      positive: analytics.byLocation.positive[location] || 0,
      negative: analytics.byLocation.negative[location] || 0,
      total: (analytics.byLocation.positive[location] || 0) + (analytics.byLocation.negative[location] || 0)
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 15);

  // Calculate percentages
  const positiveRate = analytics.total > 0 ? ((analytics.positive / analytics.total) * 100).toFixed(1) : 0;
  const negativeRate = analytics.total > 0 ? ((analytics.negative / analytics.total) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen  p-4 md:p-6">
      {/* Header */}
      <header className="bg-white rounded-xl shadow-md p-5 mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-4">
          <Activity className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">Cavite HIV Analytics</h1>
            <p className="text-sm text-gray-500">Comprehensive analysis of HIV testing results by demographics</p>
          </div>
        </div>

        {/* Last updated + refresh (refresh on the LEFT of the text as requested) */}
        <div className="flex items-center gap-3 ml-auto">
          <button
            aria-label="Refresh analytics"
            onClick={fetchAnalytics}
            className="flex items-center gap-2 rounded-full border px-3 py-1 bg-white shadow-sm hover:shadow focus:outline-none"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-700">Last updated</span>
          </button>

          <div className="text-xs text-gray-500 text-right">
            <div className="font-medium">{lastUpdated ? lastUpdated.toLocaleString() : '—'}</div>
            <div className="text-[11px]">Data snapshot</div>
          </div>
        </div>
      </header>

      {/* HORIZONTAL SUMMARY - replaces the left sidebar and is fully responsive */}
      <section className="mb-6">
        <div className="flex flex-col md:flex-row md:items-stretch gap-4">
          <div className="flex-1 bg-white rounded-xl shadow p-4 flex items-center gap-4 border-t-4 border-blue-200">
            <Users className="w-6 h-6 text-blue-600" />
            <div>
              <div className="text-sm text-gray-600">Total Cases</div>
              <div className="text-2xl md:text-3xl font-bold text-blue-700">{formatNumber(analytics.total)}</div>
              <div className="text-xs text-gray-500">{formatNumber(analytics.total)} tests completed</div>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-xl shadow p-4 flex items-center gap-4 border-t-4 border-red-200">
            <XCircle className="w-6 h-6 text-red-600" />
            <div>
              <div className="text-sm text-gray-600">HIV Positive</div>
              <div className="text-2xl md:text-3xl font-bold text-red-600">{formatNumber(analytics.positive)}</div>
              <div className="text-xs text-gray-500 mt-1">Positive Rate: <span className="font-semibold text-red-700">{positiveRate}%</span></div>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-xl shadow p-4 flex items-center gap-4 border-t-4 border-green-200">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <div className="text-sm text-gray-600">HIV Negative</div>
              <div className="text-2xl md:text-3xl font-bold text-green-600">{formatNumber(analytics.negative)}</div>
              <div className="text-xs text-gray-500 mt-1">Negative Rate: <span className="font-semibold text-green-700">{negativeRate}%</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Layout: Content */}
      <main className="space-y-6">
        {/* Overall Statistics Card */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">Overall Statistics</h2>
            <div className="text-sm text-gray-500 mt-2 md:mt-0">{analytics.total} total tests</div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg p-4 border border-blue-100 bg-blue-50">
              <div className="text-sm font-medium text-blue-700">Total Tests</div>
              <div className="text-2xl font-bold text-blue-800">{formatNumber(analytics.total)}</div>
            </div>
            <div className="rounded-lg p-4 border border-red-100 bg-red-50">
              <div className="text-sm font-medium text-red-700">Positive Cases</div>
              <div className="text-2xl font-bold text-red-800">{formatNumber(analytics.positive)}</div>
              <div className="text-xs text-red-600 mt-1">{positiveRate}% of total</div>
            </div>
            <div className="rounded-lg p-4 border border-green-100 bg-green-50">
              <div className="text-sm font-medium text-green-700">Negative Cases</div>
              <div className="text-2xl font-bold text-green-800">{formatNumber(analytics.negative)}</div>
              <div className="text-xs text-green-600 mt-1">{negativeRate}% of total</div>
            </div>
          </div>

          {/* Visual Breakdown Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Test Results Breakdown:</span>
              <span className="text-gray-600">{analytics.total} Total</span>
            </div>

            <div className="flex h-10 rounded-lg overflow-hidden border border-gray-200">
              <div
                className="flex items-center justify-center text-white font-semibold transition-all"
                style={{ background: COLORS.positive, width: `${positiveRate}%` }}
                title={`${analytics.positive} Positive (${positiveRate}%)`}
              >
                {analytics.positive > 0 && positiveRate > 12 && (
                  <span className="text-sm">{formatNumber(analytics.positive)} +</span>
                )}
              </div>

              <div
                className="flex items-center justify-center text-white font-semibold transition-all"
                style={{ background: COLORS.negative, width: `${negativeRate}%` }}
                title={`${analytics.negative} Negative (${negativeRate}%)`}
              >
                {analytics.negative > 0 && negativeRate > 12 && (
                  <span className="text-sm">{formatNumber(analytics.negative)} −</span>
                )}
              </div>
            </div>

            <div className="flex justify-between mt-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span className="text-gray-600">Positive: {formatNumber(analytics.positive)} ({positiveRate}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-gray-600">Negative: {formatNumber(analytics.negative)} ({negativeRate}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Age Group Distribution - Bar Chart */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800">Age Group Distribution</h3>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="positive" fill={COLORS.positive} name="HIV Positive" />
                <Bar dataKey="negative" fill={COLORS.negative} name="HIV Negative" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {ageData.map((age, idx) => (
                <div key={idx} className="bg-gray-50 rounded p-2 border border-gray-200">
                  <div className="font-semibold text-gray-700">{age.name} yrs</div>
                  <div className="flex justify-between mt-1">
                    <span className="text-red-600">+{age.positive}</span>
                    <span className="text-green-600">−{age.negative}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gender Distribution - Two Pie Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h4 className="text-lg font-semibold text-gray-800 text-center">Gender Distribution — Positive</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderPositiveData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill={COLORS.accentIndigo}
                  dataKey="value"
                >
                  {genderPositiveData.map((entry, index) => (
                    <Cell key={`cell-pos-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-4 text-center bg-red-50 rounded-lg p-3">
              <p className="text-3xl font-bold text-red-600 mb-1">{formatNumber(analytics.positive)}</p>
              <p className="text-sm text-gray-700 font-semibold mb-2">Total Positive Cases</p>
              <div className="text-xs text-gray-600 space-y-1">
                {Object.entries(analytics.byGender.positive).map(([gender, count]) => (
                  count > 0 && (
                    <div key={gender} className="flex justify-between">
                      <span>{gender}:</span>
                      <span className="font-semibold">{formatNumber(count)} ({Math.round((count / analytics.positive) * 100)}%)</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h4 className="text-lg font-semibold text-gray-800 text-center">Gender Distribution — Negative</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderNegativeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill={COLORS.accentIndigo}
                  dataKey="value"
                >
                  {genderNegativeData.map((entry, index) => (
                    <Cell key={`cell-neg-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-4 text-center bg-green-50 rounded-lg p-3">
              <p className="text-3xl font-bold text-green-600 mb-1">{formatNumber(analytics.negative)}</p>
              <p className="text-sm text-gray-700 font-semibold mb-2">Total Negative Cases</p>
              <div className="text-xs text-gray-600 space-y-1">
                {Object.entries(analytics.byGender.negative).map(([gender, count]) => (
                  count > 0 && (
                    <div key={gender} className="flex justify-between">
                      <span>{gender}:</span>
                      <span className="font-semibold">{formatNumber(count)} ({Math.round((count / analytics.negative) * 100)}%)</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Location Distribution (Top 15) */}
        <div className="bg-white rounded-xl shadow p-6">
          <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Location Distribution in Cavite (Top 15)
          </h4>

          <div className="mt-4 space-y-3">
            {locationData.map((loc, idx) => (
              <div key={idx} className="border-b pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                  <span className="font-semibold text-gray-800">{loc.name}</span>
                  <span className="text-sm text-gray-600 font-medium">Total: {formatNumber(loc.total)}</span>
                </div>

                {/* Visual Bar */}
                <div className="flex gap-2 h-7 mb-2 rounded overflow-hidden border border-gray-100">
                  <div
                    className="flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: COLORS.positive, width: `${loc.total > 0 ? (loc.positive / loc.total) * 100 : 0}%` }}
                    title={`${loc.positive} Positive`}
                  >
                    {loc.positive > 0 && `${formatNumber(loc.positive)}`}
                  </div>
                  <div
                    className="flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: COLORS.negative, width: `${loc.total > 0 ? (loc.negative / loc.total) * 100 : 0}%` }}
                    title={`${loc.negative} Negative`}
                  >
                    {loc.negative > 0 && `${formatNumber(loc.negative)}`}
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-red-50 rounded px-2 py-1">
                    <div className="text-red-700 font-medium">Positive</div>
                    <div className="font-bold text-red-800">{formatNumber(loc.positive)} ({loc.total > 0 ? ((loc.positive / loc.total) * 100).toFixed(1) : 0}%)</div>
                  </div>
                  <div className="bg-green-50 rounded px-2 py-1">
                    <div className="text-green-700 font-medium">Negative</div>
                    <div className="font-bold text-green-800">{formatNumber(loc.negative)} ({loc.total > 0 ? ((loc.negative / loc.total) * 100).toFixed(1) : 0}%)</div>
                  </div>
                  <div className="bg-blue-50 rounded px-2 py-1">
                    <div className="text-blue-700 font-medium">Total</div>
                    <div className="font-bold text-blue-800">{formatNumber(loc.total)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HIVAnalytics;
