const Comment = require('../models/comment')

// GET /api/comments/problem/:problemId
const getComments = async (req, res) => {
  try {
    const { parentType, parentId } = req.params

    // get all top-level comments (replyTo: null)
    const comments = await Comment.find({
      parentType,
      parentId,
      replyTo: null,
      isDeleted: false
    })
      .populate('authorId', 'username')
      .sort({ createdAt: -1 })
      .limit(50)

    // get all replies for these comments in one query
    const commentIds = comments.map(c => c._id)
    const replies = await Comment.find({
      replyTo: { $in: commentIds },
      isDeleted: false
    })
      .populate('authorId', 'username')
      .sort({ createdAt: 1 })

    // attach replies to their parent comment
    const commentMap = comments.map(c => ({
      ...c.toObject(),
      replies: replies.filter(r => r.replyTo.toString() === c._id.toString())
    }))

    res.status(200).json({ success: true, data: commentMap })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// POST /api/comments/problem/:problemId
const postComment = async (req, res) => {
  try {
    const { parentType, parentId } = req.params
    const { content } = req.body

    if (!content?.trim())
      return res.status(400).json({ success: false, message: 'Comment cannot be empty' })

    const comment = new Comment({
      authorId: req.user.id,
      parentType,
      parentId,
      content: content.trim()
    })
    await comment.save()
    await comment.populate('authorId', 'username')

    res.status(201).json({ success: true, data: { ...comment.toObject(), replies: [] } })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// POST /api/comments/problem/:problemId/reply
const postReply = async (req, res) => {
  try {
    const { parentType, parentId } = req.params
    const { content, replyTo } = req.body

    if (!content?.trim())
      return res.status(400).json({ success: false, message: 'Reply cannot be empty' })

    if (!replyTo)
      return res.status(400).json({ success: false, message: 'replyTo is required' })

    const reply = new Comment({
      authorId: req.user.id,
      parentType,
      parentId,
      content: content.trim(),
      replyTo
    })
    await reply.save()
    await reply.populate('authorId', 'username')

    res.status(201).json({ success: true, data: reply })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// POST /api/comments/:commentId/upvote
const upvoteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId)
    if (!comment)
      return res.status(404).json({ success: false, message: 'Comment not found' })

    const userId = req.user.id
    const alreadyUp = comment.upvotes.map(u => u.toString()).includes(userId)

    if (alreadyUp) {
      // toggle off
      comment.upvotes = comment.upvotes.filter(u => u.toString() !== userId)
    } else {
      comment.upvotes.push(userId)
    }

    await comment.save()
    res.status(200).json({ success: true, upvotes: comment.upvotes.length, upvoted: !alreadyUp })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// DELETE /api/comments/:commentId
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId)
    if (!comment)
      return res.status(404).json({ success: false, message: 'Comment not found' })

    // only author can delete
    if (comment.authorId.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized' })

    comment.isDeleted = true
    await comment.save()

    res.status(200).json({ success: true, message: 'Comment deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = { getComments, postComment, postReply, upvoteComment, deleteComment }