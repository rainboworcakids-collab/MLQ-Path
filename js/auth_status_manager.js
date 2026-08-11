// ===============================================
// js/auth_status_manager.js (Version 7.2 - Fixed)
// ===============================================

console.log("📁 Auth Status Manager Loaded - Fixed Version");

let userProfileCache = {};
const CACHE_TTL = 5 * 60 * 1000;

const SUPABASE_CONFIG = {
    url: window.SUPABASE_URL || 'https://oibubvhuiuurkxhnefsw.supabase.co',
//    anonKey: window.SUPABASE_ANON_KEY || 'sb_publishable_VY1yVYms2SrzuUFGFO2fpQ_MRmriNsh'
//    anonKey: window.SUPABASE_ANON_KEY || 'sb_publishable_tDw0VvUdJsLrETh25IKCRA_VG-telwP'

    anonKey: 'sb_publishable_VY1yVYms2SrzuUFGFO2fpQ_MRmriNsh'

    
};


async function getSupabaseClient() {
    if (window.SupabaseConfig && typeof window.SupabaseConfig.client === 'function') {
        try {
            const client = window.SupabaseConfig.client();
            if (client && client.auth) return client;
        } catch (error) {}
    }
    
    if (window.supabaseClient && window.supabaseClient.auth) return window.supabaseClient;
    
    if (typeof window.initializeSupabaseClient === 'function') {
        try {
            const client = window.initializeSupabaseClient();
            if (client && client.auth) return client;
        } catch (error) {}
    }
    
    return await waitForSupabase();
}

async function waitForSupabase(maxAttempts = 30, interval = 200) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const checkInterval = setInterval(() => {
            attempts++;
            
            let client = null;
            
            if (window.SupabaseConfig && typeof window.SupabaseConfig.client === 'function') {
                try { client = window.SupabaseConfig.client(); } catch (e) {}
            }
            
            if (!client && window.supabaseClient && window.supabaseClient.auth) {
                client = window.supabaseClient;
            }
            
            if (!client && typeof window.initializeSupabaseClient === 'function') {
                try { client = window.initializeSupabaseClient(); } catch (e) {}
            }
            
            if (!client && typeof supabase !== 'undefined') {
                try {
                    client = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
                } catch (e) {}
            }
            
            if (client && client.auth) {
                clearInterval(checkInterval);
                window.supabaseClient = client;
                resolve(client);
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                reject(new Error("ไม่สามารถเชื่อมต่อกับ Supabase ได้"));
            }
        }, interval);
    });
}

async function getCurrentUser() {
    try {
        const supabase = await getSupabaseClient();
        if (!supabase) return null;
        
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
            console.error('Error getting current user:', error);
            return null;
        }
        
        return user;
    } catch (error) {
        return null;
    }
}

async function checkCurrentSession() {
    try {
        const supabase = await getSupabaseClient();
        if (!supabase) return null;
        
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.error('Error getting session:', error);
            return null;
        }
        
        return session;
    } catch (error) {
        return null;
    }
}

async function getCurrentUserId() {
    try {
        const user = await getCurrentUser();
        return user ? user.id : null;
    } catch (error) {
        return null;
    }
}

async function fetchUserProfile(user) {
    if (!user) return null;

    const cached = userProfileCache[user.id];
    if (cached) {
        const now = Date.now();
        if (now - cached.timestamp < CACHE_TTL) {
            console.log(`📦 Using cached profile for user: ${user.id}`);
            return cached.data;
        } else {
            console.log(`🔄 Cache expired for user: ${user.id}`);
            delete userProfileCache[user.id];
        }
    }

    const supabase = await getSupabaseClient();
    if (!supabase) return null;

    try {
        console.log(`🔄 Fetching profile for user: ${user.id}`);
        
        // ❌ Clear cache first to ensure fresh data
        delete userProfileCache[user.id];
        
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_profile_safe', {
            user_id: user.id
        });
        
        if (!rpcError && rpcData) {
            console.log("✅ Got user profile via RPC");
            const profile = {
                uid: rpcData.uid,
                email: rpcData.email,
                name: rpcData.display_name,
                display_name: rpcData.display_name,
                grade: rpcData.grade,
                role: rpcData.role,
                avatar_url: rpcData.avatar_url,
                bio: rpcData.bio
            };
            userProfileCache[user.id] = {
                data: profile,
                timestamp: Date.now()
            };
            return profile;
        } else if (rpcError) {
            console.warn('⚠️ RPC error:', rpcError.message);
        }
        
        console.log("🔄 RPC failed, using fallback profile");
        const fallbackProfile = createFallbackProfile(user);
        userProfileCache[user.id] = {
            data: fallbackProfile,
            timestamp: Date.now()
        };
        return fallbackProfile;

    } catch (error) {
        console.error(`❌ Exception fetching user profile: ${error.message}`);
        const fallbackProfile = createFallbackProfile(user);
        userProfileCache[user.id] = {
            data: fallbackProfile,
            timestamp: Date.now()
        };
        return fallbackProfile;
    }
}

function createFallbackProfile(user) {
    console.log("🔄 Creating fallback profile from auth user");
    return {
        uid: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || 
              user.user_metadata?.name || 
              user.email?.split('@')[0] || 
              'ผู้ใช้',
        display_name: user.user_metadata?.full_name || 
                     user.user_metadata?.name || 
                     user.email?.split('@')[0] || 
                     'ผู้ใช้',
        grade: user.user_metadata?.grade || null,
        role: user.user_metadata?.role || 'student',
        avatar_url: user.user_metadata?.avatar_url,
        bio: null
    };
}

// ✅ NEW: Function to update admin menu visibility
function updateAdminMenuVisibility(isAdmin) {
    const desktopMenu = document.getElementById('admin-dashboard-desktop');
    const mobileMenu = document.getElementById('admin-dashboard-mobile');
    
    if (desktopMenu) {
        if (isAdmin) {
            desktopMenu.classList.remove('hidden');
            console.log('✅ Admin menu (desktop) shown');
        } else {
            desktopMenu.classList.add('hidden');
            console.log('📝 Admin menu (desktop) hidden');
        }
    } else {
        console.warn('❌ Desktop admin menu element not found');
    }
    
    if (mobileMenu) {
        if (isAdmin) {
            mobileMenu.classList.remove('hidden');
            console.log('✅ Admin menu (mobile) shown');
        } else {
            mobileMenu.classList.add('hidden');
            console.log('📝 Admin menu (mobile) hidden');
        }
    } else {
        console.warn('❌ Mobile admin menu element not found');
    }
}

async function updateNavMenuStatus(session) {
    try {
        let userProfile = null;
        if (session && session.user) {
            console.log('🔄 Fetching profile for user:', session.user.email);
            userProfile = await fetchUserProfile(session.user);
            console.log('✅ User profile fetched:', userProfile);
        }
        
        // ✅ FIXED: Use simpler selector
        let navContainer = document.querySelector('nav');
        if (!navContainer) {
            console.warn("⚠️ Navigation not found, will retry...");
            setTimeout(() => updateNavMenuStatus(session), 200);
            return;
        }
        
        // ✅ FIXED: Wait for elements to be rendered
        const loginLink = document.getElementById('login-link');
        const userDisplay = document.getElementById('user-display');
        
        if (!loginLink) {
            console.warn("⚠️ Login link not found, will retry...");
            setTimeout(() => updateNavMenuStatus(session), 200);
            return;
        }
        
        // ✅ Update admin menu visibility
        const isAdmin = userProfile?.role === 'admin';
        console.log('👤 User role:', userProfile?.role, '| Is Admin:', isAdmin);
        updateAdminMenuVisibility(isAdmin);
        
        if (session && session.user) {
            // User is logged in
            loginLink.href = '#';
            loginLink.innerHTML = '<i class="fas fa-sign-out-alt mr-2"></i>ออกจากระบบ';
            loginLink.onclick = (e) => {
                e.preventDefault();
                handleLogout();
            };
            
            if (userDisplay) {
                const displayName = userProfile?.display_name || 
                                  userProfile?.name || 
                                  session.user.email?.split('@')[0] || 
                                  'ผู้ใช้';
                userDisplay.textContent = displayName;
                userDisplay.classList.remove('hidden');
                console.log(`👤 Display name set to: ${displayName}`);
            }
        } else {
            // User is not logged in
            loginLink.href = 'login_supabase.html';
            loginLink.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>เข้าสู่ระบบ';
            loginLink.onclick = null;
            
            if (userDisplay) {
                userDisplay.classList.add('hidden');
            }
            
            // Hide admin menu when logged out
            updateAdminMenuVisibility(false);
        }
        
        console.log(`✅ Navigation updated: ${session ? 'LOGGED_IN' : 'GUEST'} (Admin: ${isAdmin || false})`);
        
    } catch (error) {
        console.error('❌ Error updating nav menu:', error);
    }
}

async function checkSupabaseSessionAndNav() {
    try {
        console.log("🔄 Checking Supabase session...");
        const supabase = await getSupabaseClient();
        if (!supabase) {
            console.warn("⚠️ Supabase client not available");
            await updateNavMenuStatus(null);
            return;
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.error('Error getting session:', error);
            await updateNavMenuStatus(null);
            return;
        }

        console.log(`Current Session: ${session ? 'FOUND' : 'NOT FOUND'}`);
        if (session) {
            console.log('User email:', session.user.email);
        }
        
        await updateNavMenuStatus(session);

    } catch (error) {
        console.error(`❌ Error checking session: ${error.message}`);
        await updateNavMenuStatus(null);
    }
}

/*
async function handleLogout() {
    try {
        const supabase = await getSupabaseClient();
        if (!supabase) {
            alert('ระบบการตรวจสอบสิทธิ์ยังไม่พร้อมใช้งาน');
            return;
        }
        
        console.log('🔄 Attempting to log out...');
        const { error } = await supabase.auth.signOut();
        
        if (error) throw error;
        
        // Clear cache on logout
        userProfileCache = {};
        
        console.log('✅ Logout successful. Redirecting...');
        window.location.href = 'login_supabase.html';

    } catch (error) {
        console.error(`❌ Logout failed: ${error.message}`);
        alert('ออกจากระบบไม่สำเร็จ: ' + error.message);
    }
}
*/

// เพิ่มฟังก์ชัน cleanup function
function cleanupAuthData() {
    try {
        // Clear all auth-related localStorage
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.includes('supabase') || key.includes('auth')) {
                localStorage.removeItem(key);
            }
        });
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        // Clear cookies related to auth
        document.cookie.split(";").forEach(function(c) {
            document.cookie = c.replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        
        console.log('🧹 Cleaned up all auth data');
        return true;
    } catch (error) {
        console.error('Cleanup error:', error);
        return false;
    }
}

async function handleLogout() {
    try {
        console.log('🔄 Attempting to log out...');
        
        const supabase = await getSupabaseClient();
        
        if (supabase) {
            try {
                const { error } = await supabase.auth.signOut();
                if (error) console.warn('SignOut warning:', error.message);
            } catch (signOutError) {
                console.warn('SignOut failed, proceeding with cleanup:', signOutError.message);
            }
        }
        
        // ทำ cleanup อย่างละเอียด
        cleanupAuthData();
        userProfileCache = {};
        
        console.log('✅ Logout completed. Redirecting...');
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error(`❌ Logout failed: ${error.message}`);
        
        // Fallback redirect
        cleanupAuthData();
        userProfileCache = {};
        window.location.href = 'index.html';
    }
}

function clearExpiredCache() {
    const now = Date.now();
    let cleared = 0;
    
    for (const userId in userProfileCache) {
        if (now - userProfileCache[userId].timestamp > CACHE_TTL) {
            delete userProfileCache[userId];
            cleared++;
        }
    }
    
    if (cleared > 0) {
        console.log(`🧹 Cleared ${cleared} expired cache entries`);
    }
}

function clearUserCache(userId = null) {
    if (userId) {
        delete userProfileCache[userId];
        console.log(`🧹 Cleared cache for user: ${userId}`);
    } else {
        userProfileCache = {};
        console.log('🧹 Cleared all user cache');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📁 Auth Status Manager DOMContentLoaded');
    
    // ✅ Wait for nav.js to complete first
    setTimeout(async () => {
        await checkSupabaseSessionAndNav();
        
        try {
            const supabase = await getSupabaseClient();
            if (supabase && supabase.auth) {
                supabase.auth.onAuthStateChange(async (event, session) => {
                    console.log(`🔄 Auth State Change: ${event}`);
                    
                    if (event === 'SIGNED_OUT') {
                        clearUserCache();
                    }
                    
                    if (event === 'USER_UPDATED' && session?.user?.id) {
                        clearUserCache(session.user.id);
                    }
                    
                    setTimeout(() => {
                        updateNavMenuStatus(session);
                    }, 100);
                });
            }
        } catch (authError) {
            console.error('Error setting up auth listener:', authError);
        }
        
        setInterval(clearExpiredCache, CACHE_TTL);
        
    }, 600); // ✅ Increased delay to ensure nav.js runs first
});

window.authStatusManager = {
    checkSupabaseSessionAndNav,
    handleLogout,
    updateNavMenuStatus,
    fetchUserProfile,
    getSupabaseClient,
    getCurrentUser,
    checkCurrentSession,
    getCurrentUserId,
    clearUserCache,
    clearExpiredCache,
    updateAdminMenuVisibility
};

// Backward compatibility
window.checkSupabaseSessionAndNav = checkSupabaseSessionAndNav;
window.handleLogout = handleLogout;
window.updateNavMenuStatus = updateNavMenuStatus;
window.fetchUserProfile = fetchUserProfile;
window.getSupabaseClient = getSupabaseClient;
window.getCurrentUser = getCurrentUser;
window.checkCurrentSession = checkCurrentSession;
window.getCurrentUserId = getCurrentUserId;
