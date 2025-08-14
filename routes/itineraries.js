const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Itinerary, Travel } = require('../models');
const { isAdmin, isAdminAPI } = require('../middleware/auth');

const router = express.Router();

// Use /tmp directory for uploads in Vercel environment
const uploadDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : 'uploads';
if (process.env.VERCEL && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB 限制
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只能上传图片文件'));
    }
  }
});

router.post('/', isAdmin, async (req, res) => {
  try {
    const { travelId, title, content, startDateTime, endDateTime, cost, transportMethod } = req.body;
    
    if (!travelId) {
      console.error('缺少travelId参数');
      req.flash('error_msg', '参数错误：缺少游记ID');
      return res.redirect('/travels');
    }
    
    if (!title || !title.trim()) {
      console.error('缺少标题参数');
      req.flash('error_msg', '标题不能为空');
      return res.redirect('/travels');
    }
    
    if (!startDateTime) {
      console.error('缺少开始时间');
      req.flash('error_msg', '请选择行程开始时间');
      return res.redirect('/travels');
    }
    
    if (!transportMethod) {
      console.error('缺少出行方式');
      req.flash('error_msg', '请选择出行方式');
      return res.redirect('/travels');
    }
    
    const travel = await Travel.findByPk(travelId);
    if (!travel) {
      console.error('游记不存在:', travelId);
      req.flash('error_msg', '游记不存在');
      return res.redirect('/travels');
    }

    // Parse datetime-local format and store datetime values
    let travelDate = null;
    let startTime = null;
    let endTime = null;
    
    
    if (startDateTime) {
      travelDate = new Date(startDateTime);
      const [date, time] = startDateTime.split('T');
      startTime = time; // 格式 HH:MM
    }
    
    if (endDateTime) {
      const [date, time] = endDateTime.split('T');
      endTime = time; // 格式 HH:MM
    }

    const itineraryData = {
      travelId: parseInt(travelId),
      title: title.trim(),
      content: content || '',
      location: transportMethod === '自行游览' || transportMethod === '住宿' ? '详情见内容' : null,
      travelDate: travelDate || new Date(),
      cost: cost ? parseFloat(cost) : null,
      sequence: 0,
      transportMethod: transportMethod,
      startTime: startTime || null,
      endTime: endTime || null
    };

    await Itinerary.create(itineraryData);
    req.flash('success_msg', '行程添加成功');
    res.redirect(`/travels/${travelId}`);
  } catch (error) {
    console.error('添加行程错误:', error);
    console.error('表单数据:', req.body);
    req.flash('error_msg', `添加行程失败: ${error.message}`);
    res.redirect(`/travels/${req.body.travelId || travelId}`);
  }
});

router.get('/:id/edit', isAdmin, async (req, res) => {
  try {
    const itinerary = await Itinerary.findByPk(req.params.id, {
      include: [Travel]
    });
    
    if (!itinerary) {
      req.flash('error_msg', '行程不存在');
      return res.redirect('/travels');
    }


    // Helper function to format date for datetime-local input
    const formatDateTimeLocal = (date, time) => {
      if (!date) return '';
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const timeStr = time || '00:00';
      return `${year}-${month}-${day}T${timeStr}`;
    };

    const formatEndDateTime = (date, time) => {
      if (!date) return '';
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const timeStr = time || '00:00';
      return `${year}-${month}-${day}T${timeStr}`;
    };

    res.render('itineraries/edit', { 
      itinerary, 
      travel: itinerary.Travel,
      formatDateTimeLocal,
      formatEndDateTime
    });
  } catch (error) {
    console.error('编辑行程错误:', error);
    req.flash('error_msg', '获取行程失败');
    res.redirect('/travels');
  }
});

router.put('/:id', isAdmin, async (req, res) => {
  try {
    const { title, content, startDateTime, endDateTime, cost, transportMethod } = req.body;
    
    if (!title || !title.trim()) {
      req.flash('error_msg', '标题不能为空');
      return res.redirect('/travels');
    }
    
    if (!startDateTime) {
      req.flash('error_msg', '请选择行程开始时间');
      return res.redirect('/travels');
    }
    
    if (!transportMethod) {
      req.flash('error_msg', '请选择出行方式');
      return res.redirect('/travels');
    }
    
    
    const itinerary = await Itinerary.findByPk(req.params.id);
    if (!itinerary) {
      req.flash('error_msg', '行程不存在');
      return res.redirect('/travels');
    }

    // Parse datetime-local format and store datetime values
    let travelDate = null;
    let startTime = null;
    let endTime = null;
    
    
    if (startDateTime) {
      travelDate = new Date(startDateTime);
      const [date, time] = startDateTime.split('T');
      startTime = time; // 格式 HH:MM
    }
    
    if (endDateTime) {
      const [date, time] = endDateTime.split('T');
      endTime = time; // 格式 HH:MM
    }
    
    const itineraryData = {
      title: title.trim(),
      content: content || "",
      location: transportMethod === '自行游览' || transportMethod === '住宿' ? '详情见内容' : null,
      travelDate: travelDate || new Date(),
      cost: cost ? parseFloat(cost) : null,
      sequence: 0,
      transportMethod: transportMethod,
      startTime: startTime || null,
      endTime: endTime || null
    };
    await itinerary.update(itineraryData);
    req.flash('success_msg', '行程更新成功');
    res.redirect(`/travels/${itinerary.travelId}`);
  } catch (error) {
    console.error('更新行程错误:', error);
    console.error('表单数据:', req.body);
    req.flash('error_msg', `更新行程失败: ${error.message}`);
    res.redirect(`/itineraries/${req.params.id}/edit`);
  }
});

router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const itinerary = await Itinerary.findByPk(req.params.id);
    if (!itinerary) {
      req.flash('error_msg', '行程不存在');
      return res.redirect('/travels');
    }

    const travelId = itinerary.travelId;
    await itinerary.destroy();
    req.flash('success_msg', '行程删除成功');
    res.redirect(`/travels/${travelId}`);
  } catch (error) {
    req.flash('error_msg', '删除行程失败');
    res.redirect('/travels');
  }
});

// 新建行程页面
router.get('/new', isAdmin, async (req, res) => {
  try {
    const { travelId } = req.query;
    
    if (!travelId) {
      req.flash('error_msg', '缺少游记ID');
      return res.redirect('/travels');
    }
    
    const travel = await Travel.findByPk(travelId);
    if (!travel) {
      req.flash('error_msg', '游记不存在');
      return res.redirect('/travels');
    }
    
    res.render('itineraries/new', { travel });
  } catch (error) {
    console.error('获取新建行程页面错误:', error);
    req.flash('error_msg', '获取页面失败');
    res.redirect('/travels');
  }
});

// 图片上传端点
router.post('/upload-image', isAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.json({ success: false, error: '没有选择图片文件' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, url: imageUrl });
  } catch (error) {
    console.error('图片上传错误:', error);
    res.json({ success: false, error: '图片上传失败' });
  }
});

module.exports = router;