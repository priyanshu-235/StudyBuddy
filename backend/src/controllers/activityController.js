const Submission = require("../models/submission");

const getYearlyActivity = async (req, res) => {
    try {
        const userId = req.result._id;
        const { year } = req.query;
        
        // Default to current year if not specified
        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        
        // Calculate date range for the year
        const startDate = new Date(targetYear, 0, 1); // January 1st
        const endDate = new Date(targetYear, 11, 31, 23, 59, 59); // December 31st
        
        // Aggregate submissions by date
        const submissions = await Submission.aggregate([
            {
                $match: {
                    userId: userId,
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: 'accepted' // Only count accepted submissions
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);
        
        // Convert to a map for easy lookup
        const activityMap = {};
        submissions.forEach(sub => {
            activityMap[sub._id] = sub.count;
        });
        
        // Generate all days of the year
        const activityData = [];
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            activityData.push({
                date: dateStr,
                count: activityMap[dateStr] || 0,
                submissions: activityMap[dateStr] || 0
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Calculate statistics
        const totalSubmissions = submissions.reduce((sum, sub) => sum + sub.count, 0);
        const activeDays = submissions.length;
        const maxCount = Math.max(...submissions.map(s => s.count), 0);
        
        res.status(200).json({
            year: targetYear,
            activityData,
            stats: {
                totalSubmissions,
                activeDays,
                maxCount,
                currentStreak: calculateCurrentStreak(activityData)
            }
        });
        
    } catch (err) {
        console.error('Error fetching yearly activity:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Helper function to calculate current streak
const calculateCurrentStreak = (activityData) => {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Start from today and go backwards
    for (let i = activityData.length - 1; i >= 0; i--) {
        const day = new Date(activityData[i].date);
        day.setHours(0, 0, 0, 0);
        
        if (day > today) continue; // Skip future dates
        
        if (activityData[i].count > 0) {
            streak++;
        } else if (streak > 0) {
            break; // Streak broken
        }
    }
    
    return streak;
};

module.exports = { getYearlyActivity };
