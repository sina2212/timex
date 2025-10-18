class TimeXApp {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8000'; // Update with your server URL
        this.token = localStorage.getItem('timex_token');
        this.currentUser = null;
        this.currentLocation = null;
        this.checkInTime = null;
        this.checkInId = null;
        this.durationInterval = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateCurrentTime();
        setInterval(() => this.updateCurrentTime(), 1000);
        
        if (this.token) {
            this.showDashboard();
            this.loadUserData();
            this.checkActiveSession();
        } else {
            this.showAuth();
        }
        
        this.getCurrentLocation();
    }

    setupEventListeners() {
        // Auth form toggles
        document.getElementById('show-register').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleAuthForms();
        });
        
        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleAuthForms();
        });

        // Auth forms
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin(e);
        });
        
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister(e);
        });

        // Dashboard navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Attendance
        document.getElementById('checkin-btn').addEventListener('click', () => {
            this.handleCheckIn();
        });
        
        document.getElementById('checkout-btn').addEventListener('click', () => {
            this.handleCheckOut();
        });

        // Location
        document.getElementById('get-location-btn').addEventListener('click', () => {
            this.getCurrentLocation();
        });

        // Profile forms
        document.getElementById('profile-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUpdateProfile(e);
        });
        
        document.getElementById('password-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleChangePassword(e);
        });

        // Users
        document.getElementById('refresh-users-btn').addEventListener('click', () => {
            this.loadUsers();
        });

        // Attendance history
        document.getElementById('refresh-attendance-btn').addEventListener('click', () => {
            this.loadMyAttendance();
        });

        document.getElementById('filter-attendance-btn').addEventListener('click', () => {
            this.filterMyAttendance();
        });

        // Admin attendance
        document.getElementById('refresh-all-attendance-btn').addEventListener('click', () => {
            this.loadAllAttendance();
        });

        document.getElementById('filter-all-attendance-btn').addEventListener('click', () => {
            this.filterAllAttendance();
        });
    }

    // Utility Methods
    showLoading() {
        document.getElementById('loading-spinner').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading-spinner').classList.add('hidden');
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const iconClass = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        }[type];
        
        toast.innerHTML = `
            <i class="${iconClass}"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close">&times;</button>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
        
        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }

    updateCurrentTime() {
        const now = new Date();
        const timeString = now.toLocaleString('fa-IR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        const timeElement = document.getElementById('current-time');
        if (timeElement) {
            timeElement.textContent = timeString;
        }
    }

    updateDuration() {
        if (this.checkInTime) {
            const now = new Date();
            const checkIn = new Date(this.checkInTime);
            const diff = now - checkIn;
            
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            const durationElement = document.getElementById('duration');
            if (durationElement) {
                durationElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }
    }

    // API Methods
    async apiCall(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (this.token) {
            options.headers['Authorization'] = `Bearer ${this.token}`;
        }

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}${endpoint}`, options);
            const result = await response.json();
            
            if (result.status === 'error' && result.error_code === 401) {
                this.handleLogout();
                return null;
            }
            
            return result;
        } catch (error) {
            console.error('API Error:', error);
            this.showToast('خطا در ارتباط با سرور', 'error');
            return null;
        }
    }

    // Authentication Methods
    toggleAuthForms() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        loginForm.classList.toggle('hidden');
        registerForm.classList.toggle('hidden');
    }

    async handleLogin(event) {
        const formData = new FormData(event.target);
        const data = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        this.showLoading();
        const result = await this.apiCall('/login', 'POST', data);
        this.hideLoading();

        if (result && result.status === 'ok') {
            this.token = result.message; // The token is in the message field
            localStorage.setItem('timex_token', this.token);
            this.parseToken();
            this.showDashboard();
            this.loadUserData();
            this.showToast('با موفقیت وارد شدید', 'success');
        } else {
            this.showToast(result?.message || 'خطا در ورود', 'error');
        }
    }

    async handleRegister(event) {
        const formData = new FormData(event.target);
        const data = {
            full_name: formData.get('full_name'),
            username: formData.get('username'),
            password: formData.get('password'),
            phone_number: formData.get('phone_number')
        };

        this.showLoading();
        const result = await this.apiCall('/register', 'POST', data);
        this.hideLoading();

        if (result && result.status === 'ok') {
            this.showToast('ثبت نام با موفقیت انجام شد. اکنون وارد شوید', 'success');
            this.toggleAuthForms();
            event.target.reset();
        } else {
            this.showToast(result?.message || 'خطا در ثبت نام', 'error');
        }
    }

    parseToken() {
        try {
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            this.currentUser = payload.user;
        } catch (error) {
            console.error('Error parsing token:', error);
            this.handleLogout();
        }
    }

    handleLogout() {
        localStorage.removeItem('timex_token');
        this.token = null;
        this.currentUser = null;
        this.checkInTime = null;
        this.checkInId = null;
        
        if (this.durationInterval) {
            clearInterval(this.durationInterval);
            this.durationInterval = null;
        }
        
        // Reset UI state
        const checkinBtn = document.getElementById('checkin-btn');
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkinBtn) checkinBtn.classList.add('hidden');
        if (checkoutBtn) checkoutBtn.classList.add('hidden');
        
        this.showAuth();
        this.showToast('خروج موفقیت‌آمیز', 'success');
    }

    // UI Methods
    showAuth() {
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
    }

    showDashboard() {
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        
        if (this.currentUser) {
            document.getElementById('user-name').textContent = this.currentUser.full_name || this.currentUser.username;
            
            // Hide users tab for non-admin users
            const usersNavItem = document.querySelector('[data-tab="users"]').parentElement;
            if (this.currentUser.username !== 'admin') {
                usersNavItem.style.display = 'none';
            } else {
                usersNavItem.style.display = 'block';
            }
            
            // Add refresh status button if it doesn't exist
            this.addRefreshStatusButton();
        }
    }

    addRefreshStatusButton() {
        const statusActions = document.querySelector('.status-actions');
        if (statusActions && !document.getElementById('refresh-status-btn')) {
            const refreshBtn = document.createElement('button');
            refreshBtn.id = 'refresh-status-btn';
            refreshBtn.className = 'btn btn-outline';
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> بروزرسانی وضعیت';
            refreshBtn.addEventListener('click', () => this.checkActiveSession());
            statusActions.appendChild(refreshBtn);
        }
    }

    switchTab(tabName) {
        // Update nav
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Load tab-specific data
        if (tabName === 'users' && this.currentUser.username === 'admin') {
            this.loadUsers();
            this.loadAllAttendance();
        } else if (tabName === 'profile') {
            this.loadMyAttendance();
        }
    }

    loadUserData() {
        this.parseToken();
        if (this.currentUser) {
            // Load profile data
            document.getElementById('profile-username').value = this.currentUser.username || '';
            document.getElementById('profile-phone').value = this.currentUser.phone_number || '';
        }
    }

    // Location Methods
    getCurrentLocation() {
        const locationStatus = document.getElementById('location-status');
        const coordinates = document.getElementById('coordinates');
        
        locationStatus.textContent = 'در حال دریافت موقعیت...';
        coordinates.classList.add('hidden');

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.currentLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    
                    locationStatus.textContent = 'موقعیت با موفقیت دریافت شد';
                    document.getElementById('latitude').textContent = this.currentLocation.lat.toFixed(6);
                    document.getElementById('longitude').textContent = this.currentLocation.lng.toFixed(6);
                    coordinates.classList.remove('hidden');
                },
                (error) => {
                    console.error('Location error:', error);
                    locationStatus.textContent = 'خطا در دریافت موقعیت';
                    this.showToast('خطا در دریافت موقعیت مکانی', 'error');
                }
            );
        } else {
            locationStatus.textContent = 'مرورگر شما از تعیین موقعیت پشتیبانی نمی‌کند';
        }
    }

    // Attendance Methods
    async handleCheckIn() {
        // if (!this.currentLocation) {
        //     this.showToast('ابتدا موقعیت مکانی خود را دریافت کنید', 'warning');
        //     return;
        // }

        const data = {
            time_in: new Date().toISOString(),
            // lat: this.currentLocation.lat,
            // lng: this.currentLocation.lng
        };

        this.showLoading();
        const result = await this.apiCall('/in', 'POST', data);
        this.hideLoading();

        if (result && result.status === 'ok') {
            this.checkInTime = data.time_in;
            this.checkInId = result.check_in_id;
            this.updateAttendanceUI(true);
            this.showToast('ورود با موفقیت ثبت شد', 'success');
            
            // Start duration timer
            this.durationInterval = setInterval(() => this.updateDuration(), 1000);
        } else {
            this.showToast(result?.message || 'خطا در ثبت ورود', 'error');
        }
    }

    async handleCheckOut() {
        // if (!this.currentLocation) {
        //     this.showToast('ابتدا موقعیت مکانی خود را دریافت کنید', 'warning');
        //     return;
        // }

        const data = {
            time_out: new Date().toISOString(),
            // lat: this.currentLocation.lat,
            // lng: this.currentLocation.lng
        };

        this.showLoading();
        const result = await this.apiCall('/out', 'POST', data);
        this.hideLoading();

        if (result && result.status === 'ok') {
            // Clear check-in state first
            this.checkInTime = null;
            this.checkInId = null;
            
            if (this.durationInterval) {
                clearInterval(this.durationInterval);
                this.durationInterval = null;
            }
            
            this.updateAttendanceUI(false);
            this.showToast('خروج با موفقیت ثبت شد', 'success');
        } else {
            this.showToast(result?.message || 'خطا در ثبت خروج', 'error');
        }
    }

    // Check for active session on app initialization
    async checkActiveSession() {
        try {
            this.showLoading();
            
            // Use the my-attendance endpoint to check for active sessions
            const result = await this.apiCall('/my-attendance', 'GET');
            
            this.hideLoading();
            
            if (result && result.status === 'ok' && result.attendance) {
                // Find the most recent attendance record
                const sortedAttendance = result.attendance.sort((a, b) => 
                    new Date(b.time_in) - new Date(a.time_in)
                );
                
                if (sortedAttendance.length > 0) {
                    const lastRecord = sortedAttendance[0];
                    // If the last record has no time_out, user has active check-in
                    if (lastRecord.time_in && !lastRecord.time_out) {
                        this.checkInTime = lastRecord.time_in;
                        this.checkInId = lastRecord.id;
                        this.updateAttendanceUI(true);
                        // Start duration timer
                        if (this.durationInterval) {
                            clearInterval(this.durationInterval);
                        }
                        this.durationInterval = setInterval(() => this.updateDuration(), 1000);
                        this.showToast('جلسه کاری فعال یافت شد', 'info');
                        return;
                    }
                }
            }
            
            // No active session found, show check-in button
            this.checkInTime = null;
            this.checkInId = null;
            this.updateAttendanceUI(false);
            
        } catch (error) {
            console.error('Error checking active session:', error);
            this.hideLoading();
            // Default to showing check-in button
            this.checkInTime = null;
            this.checkInId = null;
            this.updateAttendanceUI(false);
            this.showToast('خطا در بررسی وضعیت حضور', 'warning');
        }
    }

    updateAttendanceUI(isCheckedIn) {
        const statusTitle = document.getElementById('status-title');
        const statusDescription = document.getElementById('status-description');
        const currentSession = document.getElementById('current-session');
        const checkinBtn = document.getElementById('checkin-btn');
        const checkoutBtn = document.getElementById('checkout-btn');
        const checkinTimeElement = document.getElementById('checkin-time');

        if (isCheckedIn) {
            statusTitle.textContent = 'حضور فعال';
            statusDescription.textContent = 'شما در حال حاضر در محل کار حضور دارید';
            currentSession.classList.remove('hidden');
            checkinBtn.classList.add('hidden');
            checkoutBtn.classList.remove('hidden');
            
            if (this.checkInTime) {
                const checkInDate = new Date(this.checkInTime);
                checkinTimeElement.textContent = checkInDate.toLocaleString('fa-IR');
            }
        } else {
            statusTitle.textContent = 'وضعیت حضور';
            statusDescription.textContent = 'آماده برای ثبت ورود';
            currentSession.classList.add('hidden');
            
            // Only show check-in button if there's truly no active session
            // This is the key change - we're being more restrictive
            if (!this.checkInTime && !this.checkInId) {
                checkinBtn.classList.remove('hidden');
            } else {
                checkinBtn.classList.add('hidden');
            }
            checkoutBtn.classList.add('hidden');
        }
    }

    // Profile Methods
    async handleUpdateProfile(event) {
        const formData = new FormData(event.target);
        const data = {
            username: formData.get('username'),
            phone_number: formData.get('phone_number')
        };

        this.showLoading();
        const result = await this.apiCall('/users', 'PATCH', data);
        this.hideLoading();

        if (result && result.status === 'OK') {
            this.showToast('اطلاعات با موفقیت بروزرسانی شد', 'success');
            // Update current user data
            this.currentUser.username = data.username;
            this.currentUser.phone_number = data.phone_number;
        } else {
            this.showToast(result?.message || 'خطا در بروزرسانی اطلاعات', 'error');
        }
    }

    async handleChangePassword(event) {
        const formData = new FormData(event.target);
        const password = formData.get('password');
        const confirmPassword = document.getElementById('confirm-password').value;

        if (password !== confirmPassword) {
            this.showToast('رمز عبور و تأیید آن یکسان نیستند', 'error');
            return;
        }

        const data = { password };

        this.showLoading();
        const result = await this.apiCall('/users', 'PUT', data);
        this.hideLoading();

        if (result && result.status === 'OK') {
            this.showToast('رمز عبور با موفقیت تغییر کرد', 'success');
            event.target.reset();
        } else {
            this.showToast(result?.message || 'خطا در تغییر رمز عبور', 'error');
        }
    }

    // Users Methods
    async loadUsers() {
        this.showLoading();
        const result = await this.apiCall('/users', 'GET');
        this.hideLoading();

        if (result && result.status === 'ok') {
            this.displayUsers(result.users);
        } else {
            this.showToast('خطا در بارگذاری کاربران', 'error');
        }
    }

    displayUsers(users) {
        const container = document.getElementById('users-container');
        container.innerHTML = '';

        if (!users || users.length === 0) {
            container.innerHTML = '<p class="text-center">کاربری یافت نشد</p>';
            return;
        }

        // Also populate the user filter dropdown for admin
        const userFilter = document.getElementById('user-filter');
        if (userFilter) {
            userFilter.innerHTML = '<option value="">همه کاربران</option>';
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.full_name || user.username;
                userFilter.appendChild(option);
            });
        }

        users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.innerHTML = `
                <h4>${user.full_name || 'نام نامشخص'}</h4>
                <p><strong>نام کاربری:</strong> ${user.username}</p>
                <p><strong>شماره تلفن:</strong> ${user.phone_number || 'نامشخص'}</p>
                <p><strong>شناسه:</strong> ${user.id}</p>
            `;
            container.appendChild(userCard);
        });
    }

    // Attendance Methods
    async loadMyAttendance() {
        this.showLoading();
        const result = await this.apiCall('/my-attendance', 'GET');
        this.hideLoading();

        if (result && result.status === 'ok') {
            this.displayMyAttendance(result.attendance);
        } else {
            this.showToast('خطا در بارگذاری سابقه حضور و غیاب', 'error');
        }
    }

    async loadAllAttendance() {
        if (this.currentUser.username !== 'admin') {
            this.showToast('دسترسی محدود - فقط ادمین', 'error');
            return;
        }

        this.showLoading();
        const result = await this.apiCall('/attendance', 'GET');
        const usersResult = await this.apiCall('/users', 'GET');
        this.hideLoading();

        if (result && result.status === 'ok') {
            const mainresult=result.attendance.map(record => {
                const user = usersResult.users.find(u => u.id === record.user_id);
                return {
                    ...record,
                    full_name: user ? user.full_name : 'نامشخص'
                };
            });
            this.displayAllAttendance(mainresult);
        } else {
            this.showToast('خطا در بارگذاری اطلاعات حضور و غیاب', 'error');
        }
    }

    displayMyAttendance(attendance) {
        const container = document.getElementById('my-attendance-container');
        container.innerHTML = '';

        if (!attendance || attendance.length === 0) {
            container.innerHTML = '<p class="text-center">سابقه حضور و غیابی یافت نشد</p>';
            return;
        }

        // Add header
        const header = document.createElement('div');
        header.className = 'attendance-header-row';
        header.innerHTML = `
            <div>تاریخ</div>
            <div>زمان ورود</div>
            <div>زمان خروج</div>
            <div>مدت حضور</div>
            <div>وضعیت</div>
        `;
        container.appendChild(header);

        attendance.forEach(record => {
            const recordDiv = document.createElement('div');
            recordDiv.className = 'attendance-record';
            
            const timeIn = record.time_in ? new Date(record.time_in) : null;
            const timeOut = record.time_out ? new Date(record.time_out) : null;
            const duration = this.calculateDuration(timeIn, timeOut);
            const status = timeOut ? 'complete' : 'active';
            
            recordDiv.innerHTML = `
                <div class="time-info">${timeIn ? timeIn.toLocaleDateString('fa-IR') : 'نامشخص'}</div>
                <div class="time-info">${timeIn ? timeIn.toLocaleTimeString('fa-IR') : 'نامشخص'}</div>
                <div class="time-info">${timeOut ? timeOut.toLocaleTimeString('fa-IR') : 'هنوز خروج نکرده'}</div>
                <div class="duration-info">${duration}</div>
                <div class="status-info status-${status}">${status === 'complete' ? 'تکمیل شده' : 'فعال'}</div>
            `;
            container.appendChild(recordDiv);
        });
    }

    displayAllAttendance(attendance) {
        const container = document.getElementById('all-attendance-container');
        container.innerHTML = '';

        if (!attendance || attendance.length === 0) {
            container.innerHTML = '<p class="text-center">سابقه حضور و غیابی یافت نشد</p>';
            return;
        }

        // Add header
        const header = document.createElement('div');
        header.className = 'attendance-header-row';
        header.innerHTML = `
            <div>کاربر</div>
            <div>تاریخ</div>
            <div>زمان ورود</div>
            <div>زمان خروج</div>
            <div>مدت حضور</div>
        `;
        container.appendChild(header);

        attendance.forEach(record => {
            const recordDiv = document.createElement('div');
            recordDiv.className = 'attendance-record';
            
            const timeIn = record.time_in ? new Date(record.time_in) : null;
            const timeOut = record.time_out ? new Date(record.time_out) : null;
            const duration = this.calculateDuration(timeIn, timeOut);
            
            recordDiv.innerHTML = `
                <div class="user-info">${record.full_name}</div>
                <div class="time-info">${timeIn ? timeIn.toLocaleDateString('fa-IR') : 'نامشخص'}</div>
                <div class="time-info">${timeIn ? timeIn.toLocaleTimeString('fa-IR') : 'نامشخص'}</div>
                <div class="time-info">${timeOut ? timeOut.toLocaleTimeString('fa-IR') : 'هنوز خروج نکرده'}</div>
                <div class="duration-info">${duration}</div>
            `;
            container.appendChild(recordDiv);
        });
    }

    calculateDuration(timeIn, timeOut) {
        if (!timeIn) return 'نامشخص';
        
        const endTime = timeOut || new Date();
        const diff = endTime - timeIn;
        
        if (diff < 0) return 'نامعتبر';
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    filterMyAttendance() {
        const dateFrom = document.getElementById('date-from').value;
        const dateTo = document.getElementById('date-to').value;
        
        // For now, just reload - you can add actual filtering logic here
        this.loadMyAttendance();
        
        if (dateFrom || dateTo) {
            this.showToast('فیلتر اعمال شد', 'info');
        }
    }

    filterAllAttendance() {
        const dateFrom = document.getElementById('admin-date-from').value;
        const dateTo = document.getElementById('admin-date-to').value;
        const userId = document.getElementById('user-filter').value;
        
        // For now, just reload - you can add actual filtering logic here
        this.loadAllAttendance();
        
        if (dateFrom || dateTo || userId) {
            this.showToast('فیلتر اعمال شد', 'info');
        }
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TimeXApp();
});