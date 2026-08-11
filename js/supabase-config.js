// ===============================================
// MLQ-Music  supabase-config.js  V7.1.3
// Update : 03-05-2026
// Fixed: Hybrid Identity - localStorage persistence
// ===============================================

console.log("📁 Supabase Config Loaded from: config/supabase-config.js");

// 1. Supabase Project Configuration
const SUPABASE_URL = 'https://oibubvhuiuurkxhnefsw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tDw0VvUdJsLrETh25IKCRA_VG-telwP';

window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

// 2. Global Variables
let supabaseClient = null;

// Identity Storage Key
const ANON_USER_ID_KEY = 'mlq_anonymous_user_id';

// Helper: validate UUID format
function isValidUUID(uuid) {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
}

// 3. ฟังก์ชันสร้าง Client และผูกเข้ากับ window ทันที
function initializeSupabaseClient() {
    if (typeof supabase === 'undefined') {
        console.error("❌ Supabase library not loaded. Make sure CDN is loaded first.");
        return null;
    }

    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    });

    window.supabaseClient = supabaseClient;
    console.log("✅ Supabase Client Initialized.");
    return supabaseClient;
}

// 4. Hybrid Identity: ดึงหรือสร้าง Anonymous ID (ไม่พึ่ง Auth Session)
async function getOrCreateAnonymousUserId() {
    let existingId = localStorage.getItem(ANON_USER_ID_KEY);
    
    if (existingId && isValidUUID(existingId)) {
        console.log("🔐 MLQ-System: Reusing Identity ->", existingId);
        window.__ANON_USER_ID = existingId;
        return { id: existingId };
    }
    
    // ถ้าไม่มี ID หรือไม่ถูกต้อง ให้สร้างใหม่ (ใช้ crypto.randomUUID)
    console.log("🆕 MLQ-System: Generating New Identity...");
    const newId = crypto.randomUUID();
    localStorage.setItem(ANON_USER_ID_KEY, newId);
    window.__ANON_USER_ID = newId;
    return { id: newId };
}

// 5. เรียกใช้ตอนเริ่มต้น (ใช้แทน signInAnonymously เดิม)
async function initUserSession() {
    try {
        const user = await getOrCreateAnonymousUserId();
        console.log("✅ Anonymous user session ready:", user.id);
        return user;
    } catch (err) {
        console.error("❌ initUserSession failed:", err);
        return null;
    }
}

// 6. Anonymous Sign-In (ปรับให้ใช้ Identity ที่คงที่)
async function signInAnonymously() {
    if (!supabaseClient) {
        console.warn('⚠️ Supabase client not ready for anonymous sign-in');
        return null;
    }
    // ใช้ Hybrid Identity แทนการสร้าง user ใหม่ทุกครั้ง
    const user = await initUserSession();
    if (!user) {
        console.error('❌ Could not initialize user session');
        return null;
    }
    // ยังคงเรียก supabase auth เพื่อให้ได้ access token (ถ้าจำเป็น)
    // แต่ถ้าไม่ต้องการ auth จริง ๆ อาจข้ามการเรียกนี้
    // อย่างไรก็ตาม เพื่อความเข้ากันได้กับระบบอื่น (trial_users) เราจะไม่เรียก signInAnonymously ซ้ำ
    // เพราะ trial-check จะใช้ user.id ที่ส่งไปใน body แทน
    // ดังนั้นเราสามารถส่งคืน user object ที่มี id ได้เลย
    return { id: user.id };
}

// 7. ฟังก์ชันตรวจสอบสถานะ Auth (ปรับให้ไม่ทำอะไรถ้าไม่มี session จริง)
function setupAuthStateListener() {
    if (!supabaseClient) return;

    supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log(`🔐 Auth state changed: ${event}`);
        if (event === 'SIGNED_IN' && session?.user) {
            console.log('👤 User signed in:', session.user.email || 'anonymous');
            ensureUserDocumentExists(session.user, console);
        }
    });
}

// 8. ฟังก์ชันเดิมสำหรับสร้าง/ตรวจสอบ user ในตาราง users (ไม่เปลี่ยนแปลง)
async function ensureUserDocumentExists(user, logHandler = console) {
    if (!supabaseClient) {
        const msg = '❌ Supabase Client not initialized.';
        logHandler.add ? logHandler.add(msg, 'error') : console.error(msg);
        return false;
    }

    const user_uid = user.id;
    const userEmail = user.email;

    try {
        console.log(`🔄 กำลังสร้าง/ตรวจสอบผู้ใช้: ${userEmail}`);

        const { data: result, error } = await supabaseClient.rpc('create_user_safe', {
            p_uid: user_uid,
            p_email: userEmail,
            p_role: user.user_metadata?.role || 'student'
        });

        if (error) {
            console.error('❌ RPC function error:', error);

            const { data: jsonResult, error: jsonError } = await supabaseClient.rpc('create_user_if_not_exists', {
                p_uid: user_uid,
                p_email: userEmail,
                p_role: user.user_metadata?.role || 'student'
            });

            if (jsonError) {
                console.error('❌ ทั้งสอง RPC functions ล้มเหลว:', jsonError);
                return false;
            }

            console.log('✅ สร้างผู้ใช้สำเร็จ (fallback):', jsonResult);
            return true;
        }

        console.log('✅ สร้างผู้ใช้สำเร็จ (create_user_safe):', result);
        return result === true;

    } catch (error) {
        console.error('❌ Exception in ensureUserDocumentExists:', error);
        return false;
    }
}

// 9. ฟังก์ชันสร้างผู้ใช้แบบปลอดภัย (เหมือนเดิม)
async function createUserSafe(userId, email, role = 'student') {
    if (!supabaseClient) return false;

    try {
        const { error } = await supabaseClient
            .from('users')
            .insert({
                uid: userId,
                email: email,
                role: role
            });

        if (!error) {
            console.log('✅ createUserSafe สำเร็จ');
            return true;
        }

        console.error('❌ createUserSafe ล้มเหลว:', error);
        return false;
    } catch (err) {
        console.error('❌ createUserSafe exception:', err);
        return false;
    }
}

// 10. Gallery System (คงเดิม)
const GallerySystem = {
    async getSubmissions(filters = {}) {
        if (!supabaseClient) return [];
        try {
            let query = supabaseClient
                .from('student_submissions')
                .select(`*, user:users(name, avatar_url, grade), mission:missions(title, description, thumbnail_url), stats:submission_stats(*)`)
                .eq('status', 'approved');

            if (filters.missionId && filters.missionId !== 'all') query = query.eq('mission_id', filters.missionId);
            if (filters.grade && filters.grade !== 'all') query = query.eq('user.grade', filters.grade);
            if (filters.sortBy === 'newest') query = query.order('created_at', { ascending: false });
            else if (filters.sortBy === 'popular') query = query.order('stats->total_likes', { ascending: false });
            else if (filters.sortBy === 'rating') query = query.order('stats->average_score', { ascending: false });

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching submissions:', error);
            return [];
        }
    },
    async vote(submissionId, voteType) { /* คงเดิม */ },
    async rate(submissionId, score, comment = null) { /* คงเดิม */ },
    async report(submissionId, reason, details = null, suggestedMissionId = null) { /* คงเดิม */ },
    async getNotifications(limit = 10) { /* คงเดิม */ },
    async markNotificationAsRead(notificationId) { /* คงเดิม */ }
};

// 11. Export สำหรับไฟล์อื่น
window.SupabaseConfig = {
    client: () => supabaseClient,
    gallery: GallerySystem,
    ensureUserDocument: ensureUserDocumentExists,
    createUserSafe: createUserSafe
};

// 12. Backward compatibility
window.initializeSupabaseClient = initializeSupabaseClient;
window.ensureUserDocumentExists = ensureUserDocumentExists;
window.createUserSafe = createUserSafe;
window.initUserSession = initUserSession;  // 🔑 expose สำหรับเรียกใช้ใน module อื่น
window.getOrCreateAnonymousUserId = getOrCreateAnonymousUserId;

// 13. เริ่มทำงานเมื่อ DOM พร้อม (async แล้ว)
document.addEventListener('DOMContentLoaded', async function() {
    if (typeof supabase !== 'undefined') {
        initializeSupabaseClient();
        await initUserSession();     // เปลี่ยนจาก signInAnonymously เป็น initUserSession
        setupAuthStateListener();
    } else {
        const checkInterval = setInterval(async function() {
            if (typeof supabase !== 'undefined') {
                initializeSupabaseClient();
                await initUserSession();
                setupAuthStateListener();
                clearInterval(checkInterval);
            }
        }, 100);
        setTimeout(() => clearInterval(checkInterval), 10000);
    }
});

console.log("✅ Supabase Config fully loaded and exported globally");