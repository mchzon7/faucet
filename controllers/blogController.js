const BlogPost = require('../models/BlogPost');

function getPagination(page, limit, total) {
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return {
    page,
    limit,
    total,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    prevPage: Math.max(page - 1, 1),
    nextPage: Math.min(page + 1, totalPages)
  };
}

async function getBlogIndex(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = 6;
    const skip = (page - 1) * limit;

    const [featuredPost, posts, totalPosts, categories, trendingPosts] = await Promise.all([
      BlogPost.findOne({ status: 'published' })
        .sort({ isSticky: -1, publishedAt: -1 })
        .lean(),
      BlogPost.find({ status: 'published' })
        .sort({ isSticky: -1, publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BlogPost.countDocuments({ status: 'published' }),
      BlogPost.aggregate([
        { $match: { status: 'published' } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } }
      ]),
      BlogPost.find({ status: 'published' })
        .sort({ publishedAt: -1 })
        .limit(4)
        .select('title slug readTime publishedAt')
        .lean()
    ]);

    res.render('blog', {
      title: 'Faucet Earning Blog',
      appName: process.env.APP_NAME,
      currentPath: req.path,
      featuredPost,
      posts: featuredPost ? posts.filter((post) => post._id.toString() !== featuredPost._id.toString()) : posts,
      categories,
      trendingPosts,
      pagination: getPagination(page, limit, totalPosts)
    });
  } catch (error) {
    next(error);
  }
}

async function getBlogPost(req, res, next) {
  try {
    const post = await BlogPost.findOne({
      slug: req.params.slug,
      status: 'published'
    });

    if (!post) {
      return res.status(404).render('error', {
        title: 'Article Not Found',
        message: 'This article is not available or has not been published yet.'
      });
    }

    const relatedArticles = await BlogPost.find({
      _id: { $ne: post._id },
      status: 'published',
      $or: [
        { category: post.category },
        { tags: { $in: post.tags } }
      ]
    })
      .sort({ publishedAt: -1 })
      .limit(3)
      .lean();

    res.render('post', {
      title: post.title,
      post,
      relatedArticles
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getBlogIndex,
  getBlogPost
};
