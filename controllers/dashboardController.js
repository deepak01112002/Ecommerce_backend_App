const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');
const { asyncHandler } = require('../middlewares/errorHandler');

exports.getStats = asyncHandler(async (req, res) => {
  const [productCount, categoryCount, orderCount, userCount, orders] = await Promise.all([
    Product.countDocuments({ isActive: true }),
    Category.countDocuments(),
    Order.countDocuments(),
    User.countDocuments(),
    Order.find({}, 'total createdAt')
  ]);

  const totalSales = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  // Calculate monthly stats
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const monthlyOrders = orders.filter(order =>
    new Date(order.createdAt) >= currentMonth
  );

  const monthlySales = monthlyOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const monthlyUsers = await User.countDocuments({
    createdAt: { $gte: currentMonth }
  });

  const stats = {
    productCount,
    categoryCount,
    orderCount,
    userCount,
    totalSales,
    monthlyStats: {
      orders: monthlyOrders.length,
      sales: monthlySales,
      newUsers: monthlyUsers
    },
    recentActivity: {
      lastOrderDate: orders.length > 0 ? orders[orders.length - 1].createdAt : null,
      averageOrderValue: orderCount > 0 ? Math.round(totalSales / orderCount) : 0
    }
  };

  res.success(stats, 'Dashboard stats retrieved successfully');
});