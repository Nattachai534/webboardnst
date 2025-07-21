// Google Apps Script สำหรับ Nursing Education Webboard Database
// ไฟล์: Code.gs - เวอร์ชันแก้ไขปัญหา

// ⚠️ สำคัญ: ต้องแก้ไข SPREADSHEET_ID ก่อนใช้งาน
// วิธีหา SPREADSHEET_ID: ดูจาก URL ของ Google Sheets
// https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
const SPREADSHEET_ID = '1Mofp0RuzziHBL3Bw7G3Zdl2uMfXg4nWiGOpEPutXBSU'; // ⚠️ แก้ไขตรงนี้

// ชื่อ Sheet ต่างๆ สำหรับระบบการศึกษาพยาบาล
const SHEETS = {
  POSTS: 'Posts',
  CATEGORIES: 'Categories', 
  USERS: 'Users',
  REPLIES: 'Replies',
  REPORTS: 'Reports',
  ACTIVITY_LOG: 'ActivityLog',
  NURSING_RESOURCES: 'NursingResources',
  CASE_STUDIES: 'CaseStudies'
};

// ⭐ แก้ไข: เพิ่ม error handling และ validation
function validateSpreadsheetId() {
  if (!SPREADSHEET_ID || SPREADSHEET_ID === 'YOUR_ACTUAL_SPREADSHEET_ID_HERE') {
    throw new Error('กรุณาตั้งค่า SPREADSHEET_ID ใน script properties หรือในโค้ด');
  }
}

// ⭐ แก้ไข: ใช้ Properties Service เพื่อความปลอดภัย
function getSpreadsheetId() {
  const scriptProperties = PropertiesService.getScriptProperties();
  let spreadsheetId = scriptProperties.getProperty('SPREADSHEET_ID');
  
  if (!spreadsheetId) {
    // fallback ไปใช้ constant
    spreadsheetId = SPREADSHEET_ID;
  }
  
  if (!spreadsheetId || spreadsheetId === 'YOUR_ACTUAL_SPREADSHEET_ID_HERE') {
    throw new Error('ไม่พบ SPREADSHEET_ID กรุณาตั้งค่าใน Script Properties');
  }
  
  return spreadsheetId;
}

// ⭐ แก้ไข: ปรับปรุง getSpreadsheet function
function getSpreadsheet() {
  try {
    const spreadsheetId = getSpreadsheetId();
    return SpreadsheetApp.openById(spreadsheetId);
  } catch (error) {
    console.error('Cannot access spreadsheet:', error);
    throw new Error(`ไม่สามารถเข้าถึง Spreadsheet ได้: ${error.message}`);
  }
}

// ⭐ แก้ไข: ปรับปรุง CORS และ error handling
function doPost(e) {
  try {
    // ⭐ เพิ่ม: ตรวจสอบ Content-Type
    if (!e.postData || !e.postData.contents) {
      return createErrorResponse('ไม่พบข้อมูล POST', 400);
    }

    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseError) {
      return createErrorResponse('ข้อมูล JSON ไม่ถูกต้อง', 400);
    }

    const action = data.action;
    
    if (!action) {
      return createErrorResponse('ไม่พบ action ที่ต้องการ', 400);
    }
    
    // Log all incoming requests for debugging
    console.log('Incoming request:', action, JSON.stringify(data, null, 2));
    
    // ⭐ เพิ่ม: Rate limiting check
    if (!checkRateLimit(e)) {
      return createErrorResponse('เกินจำนวนการเรียกใช้ที่อนุญาต', 429);
    }
    
    switch(action) {
      case 'getPosts':
        return createResponse(getPosts(data.categoryId, data.limit, data.offset));
        
      case 'createPost':
        if (!data.post) {
          return createErrorResponse('ไม่พบข้อมูลโพสต์', 400);
        }
        return createResponse(createPost(data.post));
        
      case 'updatePost':
        if (!data.postId || !data.updates) {
          return createErrorResponse('ไม่พบข้อมูลที่ต้องการแก้ไข', 400);
        }
        return createResponse(updatePost(data.postId, data.updates));
        
      case 'deletePost':
        if (!data.postId) {
          return createErrorResponse('ไม่พบ ID โพสต์', 400);
        }
        return createResponse(deletePost(data.postId));
        
      case 'getCategories':
        return createResponse(getCategories());
        
      case 'createReply':
        if (!data.reply) {
          return createErrorResponse('ไม่พบข้อมูลการตอบกลับ', 400);
        }
        return createResponse(createReply(data.reply));
        
      case 'likePost':
        if (!data.postId || !data.userId) {
          return createErrorResponse('ไม่พบข้อมูลที่จำเป็น', 400);
        }
        return createResponse(likePost(data.postId, data.userId));
        
      case 'reportPost':
        if (!data.report) {
          return createErrorResponse('ไม่พบข้อมูลการรายงาน', 400);
        }
        return createResponse(reportPost(data.report));
        
      case 'getReports':
        return createResponse(getReports());
        
      case 'moderateReport':
        if (!data.reportId || !data.action) {
          return createErrorResponse('ไม่พบข้อมูลการจัดการ', 400);
        }
        return createResponse(moderateReport(data.reportId, data.action));
        
      case 'loginUser':
        if (!data.username || !data.password) {
          return createErrorResponse('ไม่พบข้อมูลการเข้าสู่ระบบ', 400);
        }
        return createResponse(loginUser(data.username, data.password));
        
      case 'logActivity':
        if (!data.activity) {
          return createErrorResponse('ไม่พบข้อมูลกิจกรรม', 400);
        }
        return createResponse(logActivity(data.activity));
        
      case 'getCaseStudies':
        return createResponse(getCaseStudies());
        
      case 'createCaseStudy':
        if (!data.caseStudy) {
          return createErrorResponse('ไม่พบข้อมูล Case Study', 400);
        }
        return createResponse(createCaseStudy(data.caseStudy));
        
      case 'getNursingResources':
        return createResponse(getNursingResources());
        
      case 'addNursingResource':
        if (!data.resource) {
          return createErrorResponse('ไม่พบข้อมูลทรัพยากร', 400);
        }
        return createResponse(addNursingResource(data.resource));
        
      case 'validateMedicalInfo':
        if (!data.content) {
          return createErrorResponse('ไม่พบเนื้อหาที่ต้องตรวจสอบ', 400);
        }
        return createResponse(validateMedicalInfo(data.content));
        
      case 'getSecurityStats':
        return createResponse(getSecurityStats());
        
      case 'exportActivityLog':
        return createResponse(exportActivityLog());
        
      case 'checkSuspiciousIP':
        if (!data.ipAddress) {
          return createErrorResponse('ไม่พบ IP Address', 400);
        }
        return createResponse(checkSuspiciousIP(data.ipAddress));
        
      case 'test':
        return createResponse({
          message: 'Nursing Webboard API is working!', 
          timestamp: new Date(),
          version: '2.0'
        });
        
      default:
        return createErrorResponse('Action ไม่ถูกต้อง: ' + action, 400);
    }
  } catch(error) {
    console.error('Error in doPost:', error);
    return createErrorResponse(
      'เกิดข้อผิดพลาดภายในระบบ: ' + error.message, 
      500
    );
  }
}

// ⭐ แก้ไข: เพิ่ม Rate Limiting
const RATE_LIMIT_CACHE = CacheService.getScriptCache();
const RATE_LIMIT_PER_MINUTE = 60; // จำกัด 60 requests ต่อนาที

function checkRateLimit(e) {
  try {
    const clientIP = getClientIP(e);
    const cacheKey = `rate_limit_${clientIP}`;
    const currentCount = RATE_LIMIT_CACHE.get(cacheKey);
    
    if (currentCount) {
      const count = parseInt(currentCount);
      if (count >= RATE_LIMIT_PER_MINUTE) {
        console.warn(`Rate limit exceeded for IP: ${clientIP}`);
        return false;
      }
      RATE_LIMIT_CACHE.put(cacheKey, (count + 1).toString(), 60);
    } else {
      RATE_LIMIT_CACHE.put(cacheKey, '1', 60);
    }
    
    return true;
  } catch (error) {
    console.error('Error in rate limiting:', error);
    return true; // ถ้า error ให้ผ่านไป
  }
}

// ⭐ แก้ไข: ปรับปรุงการดึง IP Address
function getClientIP(e) {
  try {
    // ลองดึง IP จาก headers
    if (e.parameters && e.parameters['X-Forwarded-For']) {
      return e.parameters['X-Forwarded-For'][0];
    }
    if (e.parameters && e.parameters['X-Real-IP']) {
      return e.parameters['X-Real-IP'][0];
    }
    
    // fallback
    return 'Unknown';
  } catch (error) {
    return 'Unknown';
  }
}

// ⭐ แก้ไข: ปรับปรุง Response functions
function createResponse(data, statusCode = 200) {
  const response = {
    success: statusCode < 400,
    data: data,
    timestamp: new Date().toISOString(),
    version: '2.0'
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
      'Content-Type': 'application/json; charset=utf-8'
    });
}

function createErrorResponse(message, statusCode = 400) {
  const response = {
    success: false,
    error: {
      message: message,
      code: statusCode
    },
    timestamp: new Date().toISOString(),
    version: '2.0'
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
      'Content-Type': 'application/json; charset=utf-8'
    });
}

// ⭐ แก้ไข: ปรับปรุง CORS Preflight
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400'
    });
}

// ⭐ แก้ไข: ปรับปรุง getPosts function
function getPosts(categoryId = null, limit = 50, offset = 0) {
  try {
    const sheet = getSpreadsheet().getSheetByName(SHEETS.POSTS);
    if (!sheet) {
      console.log('Posts sheet not found. Please run firstTimeSetup() first.');
      return {posts: [], total: 0, hasMore: false};
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return {posts: [], total: 0, hasMore: false};
    }
    
    const headers = data[0];
    let posts = [];
    
    // ⭐ เพิ่ม: ตรวจสอบ headers
    const requiredHeaders = ['id', 'title', 'content', 'author', 'timestamp'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      console.error('Missing required headers:', missingHeaders);
      throw new Error('Sheet structure is invalid');
    }
    
    for(let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      try {
        const post = {};
        headers.forEach((header, index) => {
          post[header] = row[index] !== undefined ? row[index] : '';
        });
        
        // ⭐ เพิ่ม: Validation
        if (!post.id || !post.title) {
          console.warn(`Skipping invalid post at row ${i + 1}`);
          continue;
        }
        
        // กรองตาม category ถ้ามีการระบุ
        if(!categoryId || post.categoryId == categoryId) {
          // Load replies for this post
          post.replies = getRepliesForPost(post.id);
          posts.push(post);
        }
      } catch (rowError) {
        console.warn(`Error processing row ${i + 1}:`, rowError);
        continue;
      }
    }
    
    // เรียงลำดับตามวันที่ (ใหม่สุดก่อน) และ sticky posts
    posts.sort((a, b) => {
      if (a.isSticky && !b.isSticky) return -1;
      if (!a.isSticky && b.isSticky) return 1;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    // ⭐ แก้ไข: ปรับปรุง Pagination
    const totalPosts = posts.length;
    const startIndex = Math.max(0, offset);
    const endIndex = Math.min(totalPosts, offset + limit);
    
    return {
      posts: posts.slice(startIndex, endIndex),
      total: totalPosts,
      hasMore: endIndex < totalPosts,
      pagination: {
        offset: startIndex,
        limit: limit,
        nextOffset: endIndex < totalPosts ? endIndex : null
      }
    };
  } catch (error) {
    console.error('Error in getPosts:', error);
    throw new Error(`ไม่สามารถดึงข้อมูลโพสต์ได้: ${error.message}`);
  }
}

// ⭐ แก้ไข: ปรับปรุง createPost function
function createPost(postData) {
  try {
    const sheet = getSpreadsheet().getSheetByName(SHEETS.POSTS);
    if (!sheet) {
      throw new Error('Posts sheet not found. Please run firstTimeSetup() first.');
    }
    
    // ⭐ เพิ่ม: Input validation
    if (!postData.title || !postData.content || !postData.author) {
      throw new Error('ข้อมูลโพสต์ไม่ครบถ้วน (title, content, author จำเป็น)');
    }
    
    // ⭐ เพิ่ม: Content filtering
    const filteredContent = sanitizeContent(postData.content);
    const filteredTitle = sanitizeContent(postData.title);
    
    // สร้าง ID ใหม่
    const lastRow = sheet.getLastRow();
    const newId = Math.max(lastRow, 1); // ป้องกัน ID = 0
    
    const post = {
      id: newId,
      title: filteredTitle,
      content: filteredContent,
      author: postData.author || '',
      authorId: postData.authorId || '',
      category: postData.category || '',
      categoryId: postData.categoryId || '',
      likes: 0,
      replyCount: 0,
      timestamp: new Date().toISOString(),
      verified: postData.verified || false,
      flagged: false,
      isSticky: false,
      views: 0,
      attachments: JSON.stringify(postData.attachments || []),
      medicalInfoVerified: validateMedicalContent(filteredContent)
    };
    
    // เพิ่มข้อมูลลงใน Sheet
    sheet.appendRow([
      post.id,
      post.title,
      post.content,
      post.author,
      post.authorId,
      post.category,
      post.categoryId,
      post.likes,
      post.replyCount,
      post.timestamp,
      post.verified,
      post.flagged,
      post.isSticky,
      post.views,
      post.attachments,
      post.medicalInfoVerified
    ]);
    
    // Log activity
    logActivity({
      user: post.author,
      action: 'สร้างโพสต์ใหม่',
      target: `โพสต์ #${post.id}`,
      details: post.title,
      type: 'user_action'
    });
    
    // Update category post count
    updateCategoryPostCount(post.categoryId, 1);
    
    return post;
  } catch (error) {
    console.error('Error in createPost:', error);
    throw new Error(`ไม่สามารถสร้างโพสต์ได้: ${error.message}`);
  }
}

// ⭐ เพิ่ม: Content sanitization function
function sanitizeContent(content) {
  if (!content) return '';
  
  // ลบ HTML tags พื้นฐาน
  let sanitized = content.toString()
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  
  // จำกัดความยาว
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000) + '...';
  }
  
  return sanitized.trim();
}

// ⭐ แก้ไข: ปรับปรุง Error handling ใน firstTimeSetup
function firstTimeSetup() {
  try {
    console.log('=== Nursing Webboard First Time Setup ===');
    
    // ⭐ เพิ่ม: ตรวจสอบ permissions
    try {
      DriveApp.getRootFolder();
    } catch (permError) {
      throw new Error('ไม่มีสิทธิ์เข้าถึง Google Drive กรุณาอนุญาตสิทธิ์');
    }
    
    let spreadsheet;
    let needsUpdate = false;
    
    // ตรวจสอบว่ามี SPREADSHEET_ID หรือไม่
    if (SPREADSHEET_ID === 'YOUR_ACTUAL_SPREADSHEET_ID_HERE') {
      console.log('Creating new spreadsheet...');
      spreadsheet = SpreadsheetApp.create('NursingWebboard_Database');
      const newId = spreadsheet.getId();
      
      // บันทึก ID ลง Script Properties
      PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', newId);
      
      console.log('New Spreadsheet created! ID:', newId);
      console.log('URL:', spreadsheet.getUrl());
      needsUpdate = true;
    } else {
      try {
        spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
        console.log('Using existing spreadsheet:', spreadsheet.getName());
      } catch (openError) {
        console.log('Cannot open existing spreadsheet, creating new one...');
        spreadsheet = SpreadsheetApp.create('NursingWebboard_Database');
        const newId = spreadsheet.getId();
        
        PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', newId);
        console.log('New Spreadsheet created! ID:', newId);
        needsUpdate = true;
      }
    }
    
    // สร้างฐานข้อมูลเริ่มต้น
    createAllSheets(spreadsheet);
    
    console.log('=== Setup completed successfully! ===');
    
    return {
      success: true,
      spreadsheetId: spreadsheet.getId(),
      spreadsheetUrl: spreadsheet.getUrl(),
      needsUpdate: needsUpdate,
      message: needsUpdate ? 
        'กรุณาอัปเดต SPREADSHEET_ID ในโค้ดหรือใช้ Script Properties' : 
        'ระบบพร้อมใช้งาน!'
    };
    
  } catch (error) {
    console.error('Error in firstTimeSetup:', error);
    return {
      success: false,
      error: error.toString(),
      message: `การตั้งค่าไม่สำเร็จ: ${error.message}`
    };
  }
}

// ⭐ เพิ่ม: Utility function สำหรับตั้งค่า Script Properties
function setSpreadsheetId(spreadsheetId) {
  try {
    PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', spreadsheetId);
    return {
      success: true,
      message: 'ตั้งค่า Spreadsheet ID สำเร็จ'
    };
  } catch (error) {
    return {
      success: false,
      message: 'ไม่สามารถตั้งค่า Spreadsheet ID ได้: ' + error.message
    };
  }
}

// เหลือส่วนอื่นๆ ของ code ยังเหมือนเดิม...
// (ไม่แสดงทั้งหมดเพื่อประหยัดพื้นที่)
