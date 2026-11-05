/*********************************************************
 *  wcb - Web cơ bản | CẦU NỐI TỚI "NGƯỜI GÁC CỔNG"
 *  File này lo việc gửi yêu cầu tới API (Apps Script)
 *  và ghi nhớ phiên đăng nhập trên trình duyệt.
 *  Bạn KHÔNG cần sửa gì trong file này.
 *********************************************************/

const WCB = (function () {
  const TOKEN_KEY = 'wcb_token';
  const USER_KEY = 'wcb_user';

  /* ---------- Ghi nhớ phiên đăng nhập ---------- */
  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
  }

  function getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch (e) { return null; }
  }

  function saveSession(token, user) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) { /* trình duyệt chặn lưu trữ: bỏ qua */ }
  }

  function clearSession() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) { /* bỏ qua */ }
  }

  /* ---------- Gửi yêu cầu tới API ---------- */
  // action: tên việc cần làm (login, register, listUsers...)
  // data: thông tin gửi kèm
  async function call(action, data) {
    if (!WCB_CONFIG.API_URL || WCB_CONFIG.API_URL.indexOf('/exec') < 0) {
      throw new Error('Chưa dán API_URL đúng trong file js/config.js.');
    }
    const body = Object.assign({ action: action, token: getToken() }, data || {});

    let res;
    try {
      // Gửi dạng text/plain để Google Apps Script nhận được mà không bị chặn
      res = await fetch(WCB_CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      });
    } catch (e) {
      throw new Error('Không kết nối được máy chủ. Kiểm tra mạng Internet hoặc API_URL.');
    }

    let json;
    try {
      json = await res.json();
    } catch (e) {
      throw new Error('Máy chủ trả về dữ liệu lạ. Kiểm tra lại cách triển khai Apps Script (Bước 4).');
    }

    if (!json.ok) {
      const msg = String(json.error || 'Có lỗi xảy ra.');
      // Lỗi phiên đăng nhập -> xóa phiên và quay về trang đăng nhập
      if (msg.indexOf('SESSION:') === 0) {
        clearSession();
        if (!/index\.html$|\/$/.test(location.pathname)) {
          location.href = 'index.html';
        }
        throw new Error(msg.replace('SESSION: ', ''));
      }
      throw new Error(msg);
    }
    return json;
  }

  /* ---------- Bảo vệ trang bên trong ---------- */
  // Gọi ở đầu trang dashboard / admin.
  // adminOnly = true: chỉ quản trị viên mới được vào.
  async function requireLogin(adminOnly) {
    if (!getToken()) {
      location.href = 'index.html';
      return null;
    }
    const res = await call('me');
    saveSession(getToken(), res.user);
    if (adminOnly && res.user.role !== 'admin') {
      location.href = 'dashboard.html';
      return null;
    }
    return res.user;
  }

  async function logout() {
    try { await call('logout'); } catch (e) { /* bỏ qua */ }
    clearSession();
    location.href = 'index.html';
  }

  return {
    call: call,
    getToken: getToken,
    getUser: getUser,
    saveSession: saveSession,
    clearSession: clearSession,
    requireLogin: requireLogin,
    logout: logout
  };
})();