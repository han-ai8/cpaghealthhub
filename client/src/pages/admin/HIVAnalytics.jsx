import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Activity, Users, MapPin, TrendingUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import api from '../../utils/api';

const COLORS = {
  positive: '#EF4444',
  negative: '#10B981',
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

const HIVAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/hiv/analytics');
      setAnalytics(response.analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Activity className="w-8 h-8 text-blue-600" />
          Cavite HIV Analytics
        </h1>
        <p className="text-gray-600 mt-2">Comprehensive analysis of HIV testing results by demographics</p>
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* LEFT SIDEBAR - Summary Cards */}
        <div className="lg:col-span-1 space-y-4">
          {/* Total Cases */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-4 border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold text-gray-700">Total Cases</h3>
            </div>
            <p className="text-5xl font-bold text-blue-600">{analytics.total.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-2">
              {analytics.total} {analytics.total === 1 ? 'test' : 'tests'} completed
            </p>
          </div>

          {/* Positive Cases */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-4 border-red-200">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="w-6 h-6 text-red-600" />
              <h3 className="font-semibold text-gray-700">HIV Positive</h3>
            </div>
            <p className="text-5xl font-bold text-red-600">{analytics.positive.toLocaleString()}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-gray-600">Positive Rate:</span>
              <span className="text-lg font-bold text-red-600">{positiveRate}%</span>
            </div>
            <div className="mt-2 bg-red-50 rounded-lg p-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">of {analytics.total} total</span>
                <span className="font-semibold text-red-700">{analytics.positive} cases</span>
              </div>
            </div>
          </div>

          {/* Negative Cases */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-4 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="font-semibold text-gray-700">HIV Negative</h3>
            </div>
            <p className="text-5xl font-bold text-green-600">{analytics.negative.toLocaleString()}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-gray-600">Negative Rate:</span>
              <span className="text-lg font-bold text-green-600">{negativeRate}%</span>
            </div>
            <div className="mt-2 bg-green-50 rounded-lg p-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">of {analytics.total} total</span>
                <span className="font-semibold text-green-700">{analytics.negative} cases</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT AREA */}
        <div className="lg:col-span-3 space-y-6">
          {/* Summary Statistics Bar */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Overall Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <div className="text-sm text-blue-700 font-medium mb-1">Total Tests</div>
                <div className="text-3xl font-bold text-blue-800">{analytics.total}</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
                <div className="text-sm text-red-700 font-medium mb-1">Positive Cases</div>
                <div className="text-3xl font-bold text-red-800">{analytics.positive}</div>
                <div className="text-xs text-red-600 mt-1">{positiveRate}% of total</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                <div className="text-sm text-green-700 font-medium mb-1">Negative Cases</div>
                <div className="text-3xl font-bold text-green-800">{analytics.negative}</div>
                <div className="text-xs text-green-600 mt-1">{negativeRate}% of total</div>
              </div>
            </div>

            {/* Visual Breakdown Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Test Results Breakdown:</span>
                <span className="text-gray-600">{analytics.total} Total</span>
              </div>
              <div className="flex h-10 rounded-lg overflow-hidden border-2 border-gray-300">
                <div 
                  className="bg-red-500 flex items-center justify-center text-white font-bold transition-all"
                  style={{ width: `${positiveRate}%` }}
                  title={`${analytics.positive} Positive (${positiveRate}%)`}
                >
                  {analytics.positive > 0 && positiveRate > 15 && (
                    <span className="text-sm">{analytics.positive} (+)</span>
                  )}
                </div>
                <div 
                  className="bg-green-500 flex items-center justify-center text-white font-bold transition-all"
                  style={{ width: `${negativeRate}%` }}
                  title={`${analytics.negative} Negative (${negativeRate}%)`}
                >
                  {analytics.negative > 0 && negativeRate > 15 && (
                    <span className="text-sm">{analytics.negative} (−)</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-gray-600">Positive: {analytics.positive} ({positiveRate}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-gray-600">Negative: {analytics.negative} ({negativeRate}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Age Group Distribution - Bar Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Age Group Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="positive" fill="#EF4444" name="HIV Positive" />
                <Bar dataKey="negative" fill="#10B981" name="HIV Negative" />
              </BarChart>
            </ResponsiveContainer>
            
            {/* Age Group Summary */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {ageData.map((age, idx) => (
                <div key={idx} className="bg-gray-50 rounded p-2 border border-gray-200">
                  <div className="font-semibold text-gray-700">{age.name} years</div>
                  <div className="flex justify-between mt-1">
                    <span className="text-red-600">+{age.positive}</span>
                    <span className="text-green-600">−{age.negative}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gender Distribution - Two Pie Charts Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gender (Positive) */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Gender Distribution - Positive</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={genderPositiveData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {genderPositiveData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center mt-4 bg-red-50 rounded-lg p-3">
                <p className="text-4xl font-bold text-red-600 mb-2">
                  {analytics.positive}
                </p>
                <p className="text-sm text-gray-700 font-semibold mb-2">Total Positive Cases</p>
                <div className="text-xs text-gray-600 space-y-1">
                  {Object.entries(analytics.byGender.positive).map(([gender, count]) => (
                    count > 0 && (
                      <div key={gender} className="flex justify-between">
                        <span>{gender}:</span>
                        <span className="font-semibold">{count} ({Math.round((count / analytics.positive) * 100)}%)</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>

            {/* Gender (Negative) */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Gender Distribution - Negative</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={genderNegativeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {genderNegativeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center mt-4 bg-green-50 rounded-lg p-3">
                <p className="text-4xl font-bold text-green-600 mb-2">
                  {analytics.negative}
                </p>
                <p className="text-sm text-gray-700 font-semibold mb-2">Total Negative Cases</p>
                <div className="text-xs text-gray-600 space-y-1">
                  {Object.entries(analytics.byGender.negative).map(([gender, count]) => (
                    count > 0 && (
                      <div key={gender} className="flex justify-between">
                        <span>{gender}:</span>
                        <span className="font-semibold">{count} ({Math.round((count / analytics.negative) * 100)}%)</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Location Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-blue-600" />
              Location Distribution in Cavite (Top 15)
            </h2>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {locationData.map((loc, idx) => (
                <div key={idx} className="border-b pb-3">
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-800">{loc.name}</span>
                    <span className="text-sm text-gray-600 font-medium">
                      Total: {loc.total}
                    </span>
                  </div>
                  
                  {/* Visual Bar */}
                  <div className="flex gap-2 h-7 mb-2">
                    <div 
                      className="bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold transition-all hover:bg-red-600"
                      style={{ width: `${loc.total > 0 ? (loc.positive / loc.total) * 100 : 0}%` }}
                      title={`${loc.positive} Positive`}
                    >
                      {loc.positive > 0 && `${loc.positive}`}
                    </div>
                    <div 
                      className="bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold transition-all hover:bg-green-600"
                      style={{ width: `${loc.total > 0 ? (loc.negative / loc.total) * 100 : 0}%` }}
                      title={`${loc.negative} Negative`}
                    >
                      {loc.negative > 0 && `${loc.negative}`}
                    </div>
                  </div>
                  
                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-red-50 rounded px-2 py-1">
                      <div className="text-red-700 font-medium">Positive</div>
                      <div className="font-bold text-red-800">
                        {loc.positive} ({loc.total > 0 ? ((loc.positive / loc.total) * 100).toFixed(1) : 0}%)
                      </div>
                    </div>
                    <div className="bg-green-50 rounded px-2 py-1">
                      <div className="text-green-700 font-medium">Negative</div>
                      <div className="font-bold text-green-800">
                        {loc.negative} ({loc.total > 0 ? ((loc.negative / loc.total) * 100).toFixed(1) : 0}%)
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded px-2 py-1">
                      <div className="text-blue-700 font-medium">Total</div>
                      <div className="font-bold text-blue-800">{loc.total}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HIVAnalytics;