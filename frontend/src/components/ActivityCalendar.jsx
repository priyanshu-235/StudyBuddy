import { useState, useEffect } from 'react';
import axiosClient from '../utils/axiosClient';

const ActivityCalendar = ({ year = new Date().getFullYear() }) => {
  const [activityData, setActivityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        setLoading(true);
        const { data } = await axiosClient.get(`/activity/yearly?year=${year}`);
        setActivityData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching activity data:', err);
        setError('Failed to load activity data');
      } finally {
        setLoading(false);
      }
    };

    fetchActivityData();
  }, [year]);

  const getColorIntensity = (count, maxCount) => {
    if (count === 0) return 'bg-slate-800/50';
    if (maxCount === 0) return 'bg-emerald-900/30';
    
    const intensity = count / maxCount;
    if (intensity < 0.25) return 'bg-emerald-900/40';
    if (intensity < 0.5) return 'bg-emerald-700/50';
    if (intensity < 0.75) return 'bg-emerald-500/60';
    return 'bg-emerald-400/70';
  };

  const getMonthName = (monthIndex) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthIndex];
  };

  const getDayOfWeek = (dateStr) => {
    const date = new Date(dateStr);
    return date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  };

  const formatTooltipDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Generate weeks for the calendar
  const generateWeeks = () => {
    if (!activityData) return [];
    
    const weeks = [];
    let currentWeek = [];
    
    // Start from the first Sunday of the year (or adjust to start from first day)
    const firstDay = new Date(activityData.activityData[0].date);
    const startDay = firstDay.getDay(); // Day of week (0-6)
    
    // Add empty cells for days before the first day of the year
    for (let i = 0; i < startDay; i++) {
      currentWeek.push(null);
    }
    
    // Add all days
    activityData.activityData.forEach((day) => {
      currentWeek.push(day);
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    
    // Add remaining days to the last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  };

  // Generate month labels for the top row with proper spanning
  const getMonthLabels = () => {
    const labels = [];
    const weeks = generateWeeks();
    
    let currentMonth = -1;
    let monthStartWeek = 0;
    
    weeks.forEach((week, weekIndex) => {
      const firstDayOfWeek = week.find(day => day !== null);
      if (!firstDayOfWeek) return;
      
      const date = new Date(firstDayOfWeek.date);
      const month = date.getMonth();
      
      if (month !== currentMonth) {
        // Save previous month if exists
        if (currentMonth !== -1) {
          labels.push({
            month: currentMonth,
            startWeek: monthStartWeek,
            endWeek: weekIndex - 1
          });
        }
        
        currentMonth = month;
        monthStartWeek = weekIndex;
      }
    });
    
    // Add the last month
    if (currentMonth !== -1) {
      labels.push({
        month: currentMonth,
        startWeek: monthStartWeek,
        endWeek: weeks.length - 1
      });
    }
    
    return labels;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <span className="loading loading-spinner loading-sm text-emerald-400"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-slate-500">
        <p>{error}</p>
      </div>
    );
  }

  if (!activityData) {
    return null;
  }

  const weeks = generateWeeks();
  const monthLabels = getMonthLabels();
  const maxCount = activityData.stats.maxCount;

  return (
    <div className="w-full">
      {/* Header with stats */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold text-slate-300">
            {activityData.year} Activity
          </h3>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{activityData.stats.totalSubmissions} submissions</span>
            <span>•</span>
            <span>{activityData.stats.activeDays} active days</span>
            {activityData.stats.currentStreak > 0 && (
              <>
                <span>•</span>
                <span className="text-emerald-400">{activityData.stats.currentStreak} day streak 🔥</span>
              </>
            )}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 0.25, 0.5, 0.75, 1].map((intensity) => (
              <div
                key={intensity}
                className={`w-3 h-3 rounded-sm ${getColorIntensity(
                  Math.ceil(intensity * maxCount),
                  maxCount
                )}`}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-fit inline-block">
          {/* Top row: Month labels */}
          <div className="flex mb-2">
            <div className="w-8" /> {/* Spacer for day labels */}
            <div className="flex">
              {monthLabels.map((label) => (
                <div
                  key={label.month}
                  className="text-[10px] text-slate-500 font-medium text-center"
                  style={{ 
                    width: `${(label.endWeek - label.startWeek + 1) * 16}px`, // Each week is 12px width + 4px gap
                    minWidth: `${(label.endWeek - label.startWeek + 1) * 16}px`
                  }}
                >
                  {getMonthName(label.month)}
                </div>
              ))}
            </div>
          </div>

          {/* Calendar grid with day labels */}
          <div className="flex">
            {/* Day labels column */}
            <div className="flex flex-col mr-2 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="h-3 w-8 text-[10px] text-slate-600 font-medium flex items-center"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => {
                    if (!day) {
                      return <div key={dayIndex} className="w-3 h-3" />;
                    }

                    const colorClass = getColorIntensity(day.count, maxCount);
                    const isToday = new Date(day.date).toDateString() === new Date().toDateString();

                    return (
                      <div
                        key={day.date}
                        className={`w-3 h-3 rounded-sm cursor-pointer transition-all hover:scale-110 hover:ring-2 hover:ring-emerald-400/50 ${colorClass} ${isToday ? 'ring-2 ring-emerald-400' : ''}`}
                        onMouseEnter={(e) => {
                          setHoveredDay(day);
                          setTooltipPosition({ x: e.clientX, y: e.clientY });
                        }}
                        onMouseLeave={() => setHoveredDay(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div 
          className="fixed z-50 px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg shadow-xl pointer-events-none"
          style={{
            left: `${tooltipPosition.x + 10}px`,
            top: `${tooltipPosition.y - 40}px`,
          }}
        >
          <div className="font-medium text-slate-200">
            {formatTooltipDate(hoveredDay.date)}
          </div>
          <div className="text-slate-400 mt-1">
            {hoveredDay.count} {hoveredDay.count === 1 ? 'submission' : 'submissions'}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityCalendar;
