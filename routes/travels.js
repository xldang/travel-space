const express = require('express');
const multer = require('multer');
const path = require('path');
const { Travel, Itinerary } = require('../models');
const { isAdmin } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只能上传图片文件'));
    }
  }
});

router.get('/travels', async (req, res) => {
  try {
    const travels = await Travel.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.render('travels/index', { travels });
  } catch (error) {
    req.flash('error_msg', '获取游记列表失败');
    res.redirect('/');
  }
});

router.get('/travels/new', isAdmin, (req, res) => {
  res.render('travels/new');
});

router.post('/travels', isAdmin, upload.single('coverImage'), async (req, res) => {
  try {
    const { title, description, startLocation, endLocation, transportMethod, totalCost, startDate, endDate } = req.body;
    
    const travelData = {
      title,
      description,
      startLocation,
      endLocation,
      transportMethod,
      totalCost: totalCost || null,
      startDate: startDate || null,
      endDate: endDate || null,
      coverImage: req.file ? req.file.filename : null
    };

    await Travel.create(travelData);
    req.flash('success_msg', '游记创建成功');
    res.redirect('/travels');
  } catch (error) {
    req.flash('error_msg', '创建游记失败');
    res.redirect('/travels/new');
  }
});

router.get('/travels/:id', async (req, res) => {
  try {
    const travel = await Travel.findByPk(req.params.id, {
      include: [{
        model: Itinerary, 
      }]
    });

    if (!travel) {
      req.flash('error_msg', '游记不存在');
      return res.redirect('/travels');
    }

    // 按行程出发时间由早到晚排序（升序）
    if (travel.Itineraries) {
      travel.Itineraries.sort((a, b) => {
        // 创建完整的日期时间对象进行比较
        const createDateTime = (date, time) => {
          const d = new Date(date);
          const [hours, minutes] = (time || '00:00').split(':');
          d.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          return d;
        };
        
        const datetimeA = createDateTime(a.travelDate, a.startTime);
        const datetimeB = createDateTime(b.travelDate, b.startTime);
        
        // 由早到晚排序（升序）
        return datetimeA - datetimeB;
      });
    }

    res.render('travels/show', { travel });
  } catch (error) {
    console.error('获取游记详情失败:', error);
    req.flash('error_msg', '获取游记详情失败: ' + error.message);
    res.redirect('/travels');
  }
});

router.get('/travels/:id/edit', isAdmin, async (req, res) => {
  try {
    const travel = await Travel.findByPk(req.params.id);
    if (!travel) {
      req.flash('error_msg', '游记不存在');
      return res.redirect('/travels');
    }
    res.render('travels/edit', { travel });
  } catch (error) {
    console.error('获取游记失败:', error);
    req.flash('error_msg', '获取游记失败: ' + error.message);
    res.redirect('/travels');
  }
});

router.put('/travels/:id', isAdmin, upload.single('coverImage'), async (req, res) => {
  try {
    const { title, description, startLocation, endLocation, transportMethod, totalCost, startDate, endDate } = req.body;
    
    const travel = await Travel.findByPk(req.params.id);
    if (!travel) {
      req.flash('error_msg', '游记不存在');
      return res.redirect('/travels');
    }

    const travelData = {
      title,
      description,
      startLocation,
      endLocation,
      transportMethod,
      totalCost: totalCost || null,
      startDate: startDate || null,
      endDate: endDate || null
    };

    if (req.file) {
      travelData.coverImage = req.file.filename;
    }

    await travel.update(travelData);
    req.flash('success_msg', '游记更新成功');
    res.redirect(`/travels/${req.params.id}`);
  } catch (error) {
    console.error('更新游记失败:', error);
    req.flash('error_msg', '更新游记失败: ' + error.message);
    res.redirect(`/travels/${req.params.id}/edit`);
  }
});

router.delete('/travels/:id', isAdmin, async (req, res) => {
  try {
    const travel = await Travel.findByPk(req.params.id);
    if (!travel) {
      req.flash('error_msg', '游记不存在');
      return res.redirect('/travels');
    }

    await travel.destroy();
    req.flash('success_msg', '游记删除成功');
    res.redirect('/travels');
  } catch (error) {
    req.flash('error_msg', '删除游记失败');
    res.redirect('/travels');
  }
});

module.exports = router;