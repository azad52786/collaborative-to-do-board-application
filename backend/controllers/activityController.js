const Activity = require('../models/Activity');

const getActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const activities = await Activity.getAccessibleActivities(req.user.id, limit);
    
    res.json(activities);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      error: 'Failed to fetch activities',
      code: 'FETCH_ACTIVITIES_FAILED'
    });
  }
};

module.exports = {
  getActivities
};
