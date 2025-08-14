const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();

// 登录页面
router.get('/login', (req, res) => {
  res.render('auth/login');
});

// 处理登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 查找用户
    const user = await User.findOne({ where: { username } });
    if (!user) {
      req.flash('error_msg', '用户名或密码错误');
      return res.redirect('/login');
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash('error_msg', '用户名或密码错误');
      return res.redirect('/login');
    }

    // 设置session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;

    req.flash('success_msg', '登录成功！');
    res.redirect('/travels');
  } catch (error) {
    console.error('登录错误:', error);
    req.flash('error_msg', '登录失败');
    res.redirect('/login');
  }
});

// 登出
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('登出错误:', err);
    }
    res.redirect('/travels');
  });
});

// 注册页面（管理员专用）
router.get('/register', isAuthenticated, async (req, res) => {
  // 检查是否已存在管理员
  const adminCount = await User.count({ where: { role: 'admin' } });
  if (adminCount > 0 && req.session.role !== 'admin') {
    req.flash('error_msg', '已有管理员账户，请联系管理员');
    return res.redirect('/login');
  }
  res.render('auth/register');
});

// 处理注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // 验证输入
    if (!username || !email || !password) {
      req.flash('error_msg', '请填写所有必填字段');
      return res.redirect('/register');
    }

    if (password !== confirmPassword) {
      req.flash('error_msg', '两次输入的密码不一致');
      return res.redirect('/register');
    }

    // 检查用户名和邮箱是否已存在
    const existingUser = await User.findOne({ 
      where: { 
        [require('sequelize').Op.or]: [{ username }, { email }] 
      } 
    });
    
    if (existingUser) {
      req.flash('error_msg', '用户名或邮箱已存在');
      return res.redirect('/register');
    }

    // 检查是否已存在管理员
    const adminCount = await User.count({ where: { role: 'admin' } });
    const role = adminCount === 0 ? 'admin' : 'viewer';

    // 创建用户
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      username,
      email,
      password: hashedPassword,
      role
    });

    req.flash('success_msg', '注册成功！请登录');
    res.redirect('/login');
  } catch (error) {
    console.error('注册错误:', error);
    req.flash('error_msg', '注册失败');
    res.redirect('/register');
  }
});

module.exports = router;