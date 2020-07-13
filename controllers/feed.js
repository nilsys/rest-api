const fs = require("fs");
const path = require("path");
const { validationResult } = require("express-validator");
const Post = require("../models/post");
const User = require("../models/user");

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const ITEMS_PER_PAGE = 2;
  try {
    const totalPosts = await Post.countDocuments();
    const posts = await Post.find()
      .skip((currentPage - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
    res.status(200).json({
      message: "posts found.",
      posts: posts,
      totalItems: totalPosts,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);
  const title = req.body.title;
  const content = req.body.content;
  const image = req.file;
  console.log(req.file);
  if (!image) {
    const error = new Error("Image not found.");
    error.statusCode = 422;
    throw error;
  }
  if (!errors.isEmpty()) {
    const error = new Error("validation error.");
    error.statusCode = 422;
    throw error;
  }
  const post = new Post({
    title: title,
    content: content,
    imageUrl: image.path,
    creator: req.userId,
  });
  try {
    await post.save();
    const user = await User.findById(req.userId);
    user.posts.push(post);
    await user.save();
    res.status(201).json({
      message: "post created",
      post: post,
      user: {
        _id: user._id,
        email: user.email,
      },
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("post not found");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({
        message: "post found",
        post: post,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.editPost = (req, res, next) => {
  const postId = req.params.postId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("validation error.");
    error.statusCode = 422;
    throw error;
  }
  const updatedTitle = req.body.title;
  const updatedContent = req.body.content;
  let updatedImageUrl = req.file;
  // if (req.file) {
  //   updatedImageUrl = req.file.path;
  // }
  Post.findById(postId)
    .then((post) => {
      // if (updatedImageUrl !== post.imageUrl) {
      //   deleteFile(post.imageUrl);
      // }
      if (post.creator.toString() !== req.userId) {
        const error = new Error("you are not authorized to do that.");
        error.statusCode = 403;
        throw error;
      }
      post.title = updatedTitle;
      post.content = updatedContent;
      // post.imageUrl = updatedImageUrl;
      if (updatedImageUrl) {
        deleteFile(post.imageUrl);
        post.imageUrl = updatedImageUrl.path;
      }
      return post.save();
    })
    .then((result) => {
      res.status(200).json({
        message: "updated post",
        post: result,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        // checking for right user before delete..
        const error = new Error("post not found");
        error.statusCode = 404;
        throw error;
      }
      if (post.creator.toString() !== req.userId) {
        const error = new Error("you are not authorized to do that.");
        error.statusCode = 403;
        throw error;
      }
      deleteFile(post.imageUrl);
      return Post.findByIdAndRemove(postId);
    })
    .then((result) => {
      res.status(200).json({
        message: "Post deleted",
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

const deleteFile = (filePath) => {
  const file = path.join(__dirname, "..", filePath);
  fs.unlink(file, (err) => console.log(err));
};
