// src/pages/admin/HIVAnalytics.jsx - FIXED FOR 72 GENDER IDENTITIES
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
  RefreshCw,
  TestTube,
  Heart
} from 'lucide-react';
import api from '../../utils/api';

// ✅ FIXED: Expanded color palette for all 72 gender identities
const generateColorPalette = (count) => {
  const colors = [];
  const hueStep = 360 / count;
  
  for (let i = 0; i < count; i++) {
    const hue = (i * hueStep) % 360;
    // Alternate between different saturations and lightness for variety
    const saturation = 60 + (i % 3) * 15; // 60%, 75%, 90%
    const lightness = 45 + (i % 2) * 10; // 45%, 55%
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }
  
  return colors;
};

const COLORS = {
  testing: '#3B82F6', // blue
  psychosocial: '#8B5CF6', // purple
  age: ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4', '#84CC16'],
  // ✅ REMOVED: Old limited gender color arrays
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

  // ✅ FIXED: Prepare gender data with dynamic colors for all 72 identities
  const genderTestingEntries = Object.entries(analytics.testing.byGender || {})
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]); // Sort by count descending

  const genderPsychosocialEntries = Object.entries(analytics.psychosocial.byGender || {})
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]); // Sort by count descending

  // Generate colors dynamically based on number of genders
  const testingColors = generateColorPalette(genderTestingEntries.length);
  const psychosocialColors = generateColorPalette(genderPsychosocialEntries.length);

  const genderTestingData = genderTestingEntries.map(([gender, count], idx) => ({
    name: gender,
    value: count,
    color: testingColors[idx]
  }));

  const genderPsychosocialData = genderPsychosocialEntries.map(([gender, count], idx) => ({
    name: gender,
    value: count,
    color: psychosocialColors[idx]
  }));

  // Age data preparation
  const allAgeGroups = new Set([
    ...Object.keys(analytics.testing.byAge || {}),
    ...Object.keys(analytics.psychosocial.byAge || {})
  ]);

  const ageData = Array.from(allAgeGroups).map((ageGroup) => ({
    name: ageGroup,
    testing: analytics.testing.byAge[ageGroup] || 0,
    psychosocial: analytics.psychosocial.byAge[ageGroup] || 0,
    total: (analytics.testing.byAge[ageGroup] || 0) + (analytics.psychosocial.byAge[ageGroup] || 0)
  })).sort((a, b) => {
    const order = ['Unknown', '0-17', '18-24', '25-34', '35-44', '45-54', '55+'];
    return order.indexOf(a.name) - order.indexOf(b.name);
  });

  // Location data
  const allLocations = new Set([
    ...Object.keys(analytics.testing.byLocation || {}),
    ...Object.keys(analytics.psychosocial.byLocation || {})
  ]);

  const locationData = Array.from(allLocations)
    .map((location) => ({
      name: location,
      testing: analytics.testing.byLocation[location] || 0,
      psychosocial: analytics.psychosocial.byLocation[location] || 0,
      total: (analytics.testing.byLocation[location] || 0) + (analytics.psychosocial.byLocation[location] || 0)
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 15);

  const testingPercentage = analytics.overall.testingPercentage || 0;
  const psychosocialPercentage = analytics.overall.psychosocialPercentage || 0;

  // ✅ NEW: Custom tooltip for better readability
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{payload[0].name}</p>
          <p className="text-sm text-gray-600">
            Count: <span className="font-bold">{formatNumber(payload[0].value)}</span>
          </p>
          <p className="text-xs text-gray-500">
            {((payload[0].value / payload[0].payload.total) * 100).toFixed(1)}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Header */}
      <header className="bg-white rounded-xl shadow-md p-5 mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-4">
          <Activity className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">Service Usage Analytics</h1>
            <p className="text-sm text-gray-500">Comprehensive analysis of completed appointments by service type</p>
          </div>
        </div>

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

      {/* Summary Cards */}
      <section className="mb-6">
        <div className="flex flex-col md:flex-row md:items-stretch gap-4">
          <div className="flex-1 bg-white rounded-xl shadow p-4 flex items-center gap-4 border-t-4 border-gray-200">
            <Users className="w-6 h-6 text-gray-600" />
            <div>
              <div className="text-sm text-gray-600">Total Completed</div>
              <div className="text-2xl md:text-3xl font-bold text-gray-700">{formatNumber(analytics.overall.total)}</div>
              <div className="text-xs text-gray-500">{formatNumber(analytics.overall.total)} appointments</div>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-xl shadow p-4 flex items-center gap-4 border-t-4 border-blue-200">
            <TestTube className="w-6 h-6 text-blue-600" />
            <div>
              <div className="text-sm text-gray-600">Testing & Counseling</div>
              <div className="text-2xl md:text-3xl font-bold text-blue-600">{formatNumber(analytics.testing.total)}</div>
              <div className="text-xs text-gray-500 mt-1">
                <span className="font-semibold text-blue-700">{testingPercentage}%</span> of total
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-xl shadow p-4 flex items-center gap-4 border-t-4 border-purple-200">
            <Heart className="w-6 h-6 text-purple-600" />
            <div>
              <div className="text-sm text-gray-600">Psychosocial Support</div>
              <div className="text-2xl md:text-3xl font-bold text-purple-600">{formatNumber(analytics.psychosocial.total)}</div>
              <div className="text-xs text-gray-500 mt-1">
                <span className="font-semibold text-purple-700">{psychosocialPercentage}%</span> of total
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="space-y-6">
        {/* Overall Statistics Card */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">Overall Service Statistics</h2>
            <div className="text-sm text-gray-500 mt-2 md:mt-0">{analytics.overall.total} completed appointments</div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg p-4 border border-gray-100 bg-gray-50">
              <div className="text-sm font-medium text-gray-700">Total Completed</div>
              <div className="text-2xl font-bold text-gray-800">{formatNumber(analytics.overall.total)}</div>
            </div>
            <div className="rounded-lg p-4 border border-blue-100 bg-blue-50">
              <div className="text-sm font-medium text-blue-700">Testing & Counseling</div>
              <div className="text-2xl font-bold text-blue-800">{formatNumber(analytics.testing.total)}</div>
              <div className="text-xs text-blue-600 mt-1">{testingPercentage}% of total</div>
            </div>
            <div className="rounded-lg p-4 border border-purple-100 bg-purple-50">
              <div className="text-sm font-medium text-purple-700">Psychosocial Support</div>
              <div className="text-2xl font-bold text-purple-800">{formatNumber(analytics.psychosocial.total)}</div>
              <div className="text-xs text-purple-600 mt-1">{psychosocialPercentage}% of total</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Service Distribution:</span>
              <span className="text-gray-600">{analytics.overall.total} Total</span>
            </div>

            <div className="flex h-10 rounded-lg overflow-hidden border border-gray-200">
              <div
                className="flex items-center justify-center text-white font-semibold transition-all"
                style={{ background: COLORS.testing, width: `${testingPercentage}%` }}
                title={`${analytics.testing.total} Testing (${testingPercentage}%)`}
              >
                {analytics.testing.total > 0 && testingPercentage > 12 && (
                  <span className="text-sm">{formatNumber(analytics.testing.total)}</span>
                )}
              </div>

              <div
                className="flex items-center justify-center text-white font-semibold transition-all"
                style={{ background: COLORS.psychosocial, width: `${psychosocialPercentage}%` }}
                title={`${analytics.psychosocial.total} Psychosocial (${psychosocialPercentage}%)`}
              >
                {analytics.psychosocial.total > 0 && psychosocialPercentage > 12 && (
                  <span className="text-sm">{formatNumber(analytics.psychosocial.total)}</span>
                )}
              </div>
            </div>

            <div className="flex justify-between mt-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span className="text-gray-600">Testing: {formatNumber(analytics.testing.total)} ({testingPercentage}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded" />
                <span className="text-gray-600">Psychosocial: {formatNumber(analytics.psychosocial.total)} ({psychosocialPercentage}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Age Group Distribution */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800">Age Group Distribution by Service</h3>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="testing" fill={COLORS.testing} name="Testing & Counseling" />
                <Bar dataKey="psychosocial" fill={COLORS.psychosocial} name="Psychosocial Support" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
              {ageData.map((age, idx) => (
                <div key={idx} className="bg-gray-50 rounded p-2 border border-gray-200">
                  <div className="font-semibold text-gray-700">{age.name}</div>
                  <div className="flex justify-between mt-1">
                    <span className="text-blue-600">T: {age.testing}</span>
                    <span className="text-purple-600">P: {age.psychosocial}</span>
                  </div>
                  <div className="text-gray-500 text-[10px] mt-1">Total: {age.total}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ✅ FIXED: Gender Distribution - Two Pie Charts with ALL 72 Identities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Testing & Counseling Gender Distribution */}
          <div className="bg-white rounded-xl shadow p-6">
            <h4 className="text-lg font-semibold text-gray-800 text-center mb-4">
              Gender Distribution — Testing & Counseling
            </h4>
            <p className="text-xs text-gray-500 text-center mb-4">
              Showing all {genderTestingData.length} gender identities reported
            </p>
            
            {genderTestingData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={genderTestingData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent, value }) => 
                        percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                      }
                      outerRadius={100}
                      dataKey="value"
                    >
                      {genderTestingData.map((entry, index) => (
                        <Cell key={`cell-testing-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="mt-4 text-center bg-blue-50 rounded-lg p-3">
                  <p className="text-3xl font-bold text-blue-600 mb-1">{formatNumber(analytics.testing.total)}</p>
                  <p className="text-sm text-gray-700 font-semibold mb-3">Total Testing Appointments</p>
                  
                  {/* ✅ NEW: Scrollable list of all genders */}
                  <div className="max-h-48 overflow-y-auto border-t border-blue-200 pt-2">
                    <div className="text-xs text-gray-600 space-y-1">
                      {genderTestingEntries.map(([gender, count]) => (
                        <div key={gender} className="flex justify-between items-center py-1 px-2 hover:bg-blue-100 rounded">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ 
                              backgroundColor: genderTestingData.find(g => g.name === gender)?.color 
                            }} />
                            {gender}
                          </span>
                          <span className="font-semibold">
                            {formatNumber(count)} ({Math.round((count / analytics.testing.total) * 100)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-gray-500 py-8">No gender data available</p>
            )}
          </div>

          {/* Psychosocial Support Gender Distribution */}
          <div className="bg-white rounded-xl shadow p-6">
            <h4 className="text-lg font-semibold text-gray-800 text-center mb-4">
              Gender Distribution — Psychosocial Support
            </h4>
            <p className="text-xs text-gray-500 text-center mb-4">
              Showing all {genderPsychosocialData.length} gender identities reported
            </p>
            
            {genderPsychosocialData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={genderPsychosocialData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent, value }) => 
                        percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                      }
                      outerRadius={100}
                      dataKey="value"
                    >
                      {genderPsychosocialData.map((entry, index) => (
                        <Cell key={`cell-psychosocial-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="mt-4 text-center bg-purple-50 rounded-lg p-3">
                  <p className="text-3xl font-bold text-purple-600 mb-1">{formatNumber(analytics.psychosocial.total)}</p>
                  <p className="text-sm text-gray-700 font-semibold mb-3">Total Psychosocial Appointments</p>
                  
                  {/* ✅ NEW: Scrollable list of all genders */}
                  <div className="max-h-48 overflow-y-auto border-t border-purple-200 pt-2">
                    <div className="text-xs text-gray-600 space-y-1">
                      {genderPsychosocialEntries.map(([gender, count]) => (
                        <div key={gender} className="flex justify-between items-center py-1 px-2 hover:bg-purple-100 rounded">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ 
                              backgroundColor: genderPsychosocialData.find(g => g.name === gender)?.color 
                            }} />
                            {gender}
                          </span>
                          <span className="font-semibold">
                            {formatNumber(count)} ({Math.round((count / analytics.psychosocial.total) * 100)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-gray-500 py-8">No gender data available</p>
            )}
          </div>
        </div>

        {/* Location Distribution */}
        <div className="bg-white rounded-xl shadow p-6">
          <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Location Distribution (Top 15)
          </h4>

          <div className="mt-4 space-y-3">
            {locationData.map((loc, idx) => (
              <div key={idx} className="border-b pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                  <span className="font-semibold text-gray-800">{loc.name}</span>
                  <span className="text-sm text-gray-600 font-medium">Total: {formatNumber(loc.total)}</span>
                </div>

                <div className="flex gap-1 h-7 mb-2 rounded overflow-hidden border border-gray-100">
                  <div
                    className="flex items-center justify-center text-white text-xs font-bold"
                    style={{ 
                      background: COLORS.testing, 
                      width: `${loc.total > 0 ? (loc.testing / loc.total) * 100 : 0}%` 
                    }}
                    title={`${loc.testing} Testing`}
                  >
                    {loc.testing > 0 && loc.testing > 2 && `${formatNumber(loc.testing)}`}
                  </div>
                  <div
                    className="flex items-center justify-center text-white text-xs font-bold"
                    style={{ 
                      background: COLORS.psychosocial, 
                      width: `${loc.total > 0 ? (loc.psychosocial / loc.total) * 100 : 0}%` 
                    }}
                    title={`${loc.psychosocial} Psychosocial`}
                  >
                    {loc.psychosocial > 0 && loc.psychosocial > 2 && `${formatNumber(loc.psychosocial)}`}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-blue-50 rounded px-2 py-1">
                    <div className="text-blue-700 font-medium">Testing</div>
                    <div className="font-bold text-blue-800">
                      {formatNumber(loc.testing)} ({loc.total > 0 ? ((loc.testing / loc.total) * 100).toFixed(1) : 0}%)
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded px-2 py-1">
                    <div className="text-purple-700 font-medium">Psychosocial</div>
                    <div className="font-bold text-purple-800">
                      {formatNumber(loc.psychosocial)} ({loc.total > 0 ? ((loc.psychosocial / loc.total) * 100).toFixed(1) : 0}%)
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded px-2 py-1">
                    <div className="text-gray-700 font-medium">Total</div>
                    <div className="font-bold text-gray-800">{formatNumber(loc.total)}</div>
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