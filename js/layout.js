/*********************************************************
 *  wcb - Web cơ bản | KHUNG CHUNG CỦA CÁC TRANG BÊN TRONG
 *  Vẽ menu bên trái, thông tin người dùng, nút đăng xuất,
 *  nút mở menu trên điện thoại và thông báo nổi.
 *  Dùng chung cho dashboard.html, admin.html và các trang sau này.
 *********************************************************/

/* ================== DANH SÁCH MENU ==================
 * ✏️ Muốn thêm trang mới vào menu: thêm 1 dòng vào đây.
 *   id      : tên ngắn, khớp với tham số khi gọi WCB_LAYOUT.init(...)
 *   label   : chữ hiện trên menu
 *   icon    : biểu tượng (emoji)
 *   href    : tên file trang
 *   adminOnly: true = chỉ quản trị viên mới thấy
 */
const WCB_MENU = [
  { id: 'dashboard', label: 'Tổng quan',          icon: '🏠', href: 'dashboard.html', adminOnly: false },
  { id: 'admin',     label: 'Quản lý tài khoản',  icon: '👥', href: 'admin.html',     adminOnly: true }
];

const WCB_LAYOUT = (function () {

  // Chặn chữ lạ chèn mã vào trang
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Lấy chữ cái đầu của tên (tên tiếng Việt: lấy chữ cuối, vd "Trần Văn Bình" -> "B")
  function initial(name) {
    const parts = String(name || '?').trim().split(/\s+/);
    return (parts[parts.length - 1].charAt(0) || '?').toUpperCase();
  }

  function roleText(role) {
    return role === 'admin' ? 'Quản trị viên' : 'Thành viên';
  }

  /* ---------- Vẽ menu bên trái ---------- */
  function renderSidebar(active, user) {
    const items = WCB_MENU
      .filter(function (m) { return !m.adminOnly || user.role === 'admin'; })
      .map(function (m) {
        return '<a href="' + m.href + '"' + (m.id === active ? ' class="active" aria-current="page"' : '') + '>' +
               '<span class="ico">' + m.icon + '</span>' + esc(m.label) + '</a>';
      }).join('');

    document.getElementById('sidebar').innerHTML =
      '<div class="brand">' +
        '<div class="brand-logo">' + esc(WCB_CONFIG.APP_NAME.slice(0, 3)) + '</div>' +
        '<div><div class="brand-name">' + esc(WCB_CONFIG.APP_NAME) + '</div>' +
        '<div class="brand-sub">' + esc(WCB_CONFIG.APP_FULLNAME) + '</div></div>' +
      '</div>' +
      '<nav class="nav"><div class="nav-label">Menu</div>' + items + '</nav>' +
      '<div class="sidebar-user">' +
        '<div class="avatar">' + esc(initial(user.fullname)) + '</div>' +
        '<div class="user-meta">' +
          '<div class="user-name" title="' + esc(user.fullname) + '">' + esc(user.fullname) + '</div>' +
          '<div class="user-role">@' + esc(user.username) + ' · ' + roleText(user.role) + '</div>' +
        '</div>' +
      '</div>';
  }

  /* ---------- Mở / đóng menu trên điện thoại ---------- */
  function bindMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const btn = document.getElementById('menuBtn');
    let overlay = null;

    function close() {
      sidebar.classList.remove('open');
      if (overlay) { overlay.remove(); overlay = null; }
    }
    function open() {
      sidebar.classList.add('open');
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      overlay.addEventListener('click', close);
      document.body.appendChild(overlay);
    }
    btn.addEventListener('click', function () {
      sidebar.classList.contains('open') ? close() : open();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* ---------- Thông báo nổi góc dưới (dùng ở mọi trang) ---------- */
  let toastTimer = null;
  function toast(text, type) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.className = 'toast alert alert-' + (type || 'success');
    el.textContent = text;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.remove(); }, 3500);
  }

  /* ---------- Khởi động trang ----------
   * active    : id trang hiện tại trong WCB_MENU
   * adminOnly : true nếu trang chỉ dành cho quản trị viên
   * Trả về thông tin người dùng đang đăng nhập.
   */
  async function init(active, adminOnly) {
    const loading = document.getElementById('loading');
    const app = document.getElementById('app');

    let user;
    try {
      user = await WCB.requireLogin(adminOnly);
    } catch (err) {
      loading.innerHTML = '<div class="alert alert-error">' + esc(err.message) + '</div>' +
                          '<a class="btn btn-ghost" href="index.html">Về trang đăng nhập</a>';
      return null;
    }
    if (!user) return null; // đang chuyển trang

    renderSidebar(active, user);
    bindMobileMenu();
    document.getElementById('logoutBtn').addEventListener('click', function () {
      if (confirm('Bạn muốn đăng xuất?')) WCB.logout();
    });
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
    document.querySelectorAll('[data-app-name]').forEach(function (el) {
      el.textContent = WCB_CONFIG.APP_NAME + ' · ' + WCB_CONFIG.APP_FULLNAME;
    });

    loading.remove();
    app.classList.remove('hidden');
    return user;
  }

  return { init: init, toast: toast, esc: esc, roleText: roleText };
})();