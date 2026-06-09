const express     = require('express')
const router      = express.Router()
const verifyToken = require('../middlewares/auth.middleware')
const {
  getComments, postComment, postReply, upvoteComment, deleteComment
} = require('../controllers/comment.controller')

router.get('/:parentType/:parentId',          getComments)
router.post('/:parentType/:parentId',         verifyToken, postComment)
router.post('/:parentType/:parentId/reply',   verifyToken, postReply)
router.post('/:commentId/upvote',             verifyToken, upvoteComment)
router.delete('/:commentId',                  verifyToken, deleteComment)

module.exports = router