// Lucky_number.js - Version 2.85 (FINAL)

document.addEventListener('DOMContentLoaded', function() {
    console.log('Lucky_number.js v2.85 Initializing...');
    
    // ==================== GLOBAL VARIABLES ====================
    const mainForm = document.querySelector('form');
    const mainSearchNameInput = document.getElementById('search_name');
    const mainFullNameInput = document.querySelector('input[name="full_name"]');

    const searchModal = document.getElementById('searchModal');
    const loadMainButton = document.getElementById('load_search');
    const cancelSearchModalBtn = document.getElementById('cancel_search');
    const selectSearchBtn = document.getElementById('select_search');
    const deleteSearchBtn = document.getElementById('delete_search');
    const searchSelect = document.getElementById('search_select');

    const openSurroundingDataModalBtn = document.getElementById('openSurroundingDataModal');
    const surroundingDataModal = document.getElementById('surroundingDataModal');
    const cancelSurroundingDataBtn = document.getElementById('cancelSurroundingData');
    const surroundingDataForm = document.getElementById('surroundingDataForm');
    const modalSearchNameInput = document.getElementById('modal_search_name');

    const saveLocalStorageFileBtn = document.getElementById('save_localstorage_file');
    const loadLocalStorageFileInput = document.getElementById('load_localstorage_file_input');
    const loadLocalStorageFileBtn = document.getElementById('load_localstorage_file_btn');

    const USER_DATA_STORAGE_KEY = 'userData';

    // ==================== EDGE FUNCTION CONFIG ====================
    const SUPABASE_URL = 'oibubvhuiuurkxhnefsw.supabase.co';
    const LuckyNumber_FUNCTION = `https://${SUPABASE_URL}/functions/v1/lucky-number-calculate`;

    // ==================== HELPER FUNCTIONS ====================

    function getStoredUserData() {
        try {
            const data = localStorage.getItem(USER_DATA_STORAGE_KEY);
            const parsed = data ? JSON.parse(data) : {};
            console.log('📦 Loaded stored data:', Object.keys(parsed).length, 'entries');
            return parsed;
        } catch (error) {
            console.error('❌ Error loading stored data:', error);
            alert('❌ เกิดข้อผิดพลาดในการโหลดข้อมูลที่บันทึกไว้');
            return {};
        }
    }


    // ในฟังก์ชัน loadData เพิ่มส่วนจัดการ Comparison Date
    function loadData(searchName) {

        console.log (`loading searchName ! "${searchName}"` );
  
        if (!searchName) {
            alert('⚠️ โปรดระบุชื่อที่ต้องการโหลด');
            clearAllFormAndModalFields();
            return;
        }

        const storedData = getStoredUserData();
        const data = storedData[searchName];

        if (!data) {
            alert(`❌ ไม่พบข้อมูลสำหรับ: "${searchName}"`);
            clearAllFormAndModalFields();
            mainSearchNameInput.value = searchName;
            return;
        }

        console.log('📂 Loading data for:', searchName);

        // Populate main form fields (Birth Date)
        if (data.main_data) {
            // Birth Date
            document.querySelector('select[name="birth_day"]').value = data.main_data.birth_day || '';
            document.querySelector('select[name="birth_month"]').value = data.main_data.birth_month || '';
            document.querySelector('select[name="birth_century"]').value = data.main_data.birth_century || '20';
            document.querySelector('select[name="birth_year"]').value = data.main_data.birth_year || '';
            document.querySelector('select[name="birth_hour"]').value = data.main_data.birth_hour || '00';
            document.querySelector('select[name="birth_minute"]').value = data.main_data.birth_minute || '00';
        
            // Comparison Date (ตั้งค่าเป็นวันปัจจุบันเสมอเมื่อโหลดข้อมูล)
            const today = new Date();
            document.querySelector('select[name="comparison_day"]').value = String(today.getDate()).padStart(2, '0');
            document.querySelector('select[name="comparison_month"]').value = String(today.getMonth() + 1).padStart(2, '0');
            document.querySelector('select[name="comparison_century"]').value = '20';
            document.querySelector('select[name="comparison_year"]').value = String(today.getFullYear() % 100).padStart(2, '0');
            document.querySelector('select[name="comparison_hour"]').value = '00';
            document.querySelector('select[name="comparison_minute"]').value = '00';
        
            mainSearchNameInput.value = searchName;
        } else {
            clearMainFormFieldsExceptSearchName();
            mainSearchNameInput.value = searchName;
        }

        modalSearchNameInput.value = searchName;
        alert('✅ โหลดข้อมูลเรียบร้อยแล้ว!');
    }

    // แก้ไขฟังก์ชัน clearMainFormFieldsExceptSearchName
    function clearMainFormFieldsExceptSearchName() {
        const today = new Date();
        // Clear Birth Date
        document.querySelector('select[name="birth_day"]').value = String(today.getDate()).padStart(2, '0');
        document.querySelector('select[name="birth_month"]').value  = String(today.getMonth() + 1).padStart(2, '0');
        document.querySelector('select[name="birth_century"]').value = '20';
        document.querySelector('select[name="birth_year"]').value = String(today.getFullYear() % 100).padStart(2, '0');
        document.querySelector('select[name="birth_hour"]').value = '00';
        document.querySelector('select[name="birth_minute"]').value = '00';
    
        // Clear Comparison Date (ตั้งค่าเป็นวันปัจจุบัน)
        document.querySelector('select[name="comparison_day"]').value = String(today.getDate()).padStart(2, '0');
        document.querySelector('select[name="comparison_month"]').value = String(today.getMonth() + 1).padStart(2, '0');
        document.querySelector('select[name="comparison_century"]').value = '20';
        document.querySelector('select[name="comparison_year"]').value = String(today.getFullYear() % 100).padStart(2, '0');
        document.querySelector('select[name="comparison_hour"]').value = '00';
        document.querySelector('select[name="comparison_minute"]').value = '00';
    
        mainSearchNameInput.value = '';
    }


    function clearSurroundingModalFields() {
        for (let i = 1; i <= 20; i++) {
            const field = document.getElementById(`modal_surrounding_${String(i).padStart(2, '0')}`);
            if (field) field.value = '';
        }
    }

    function clearAllFormAndModalFields() {
        clearMainFormFieldsExceptSearchName();
        clearSurroundingModalFields();
        mainSearchNameInput.value = '';
        modalSearchNameInput.value = '';
    }

    function populateSearchSelect() {
        const storedData = getStoredUserData();
        searchSelect.innerHTML = '<option value="">-- เลือกชื่อที่บันทึกไว้ --</option>';

        const names = Object.keys(storedData).sort();
        for (const searchName of names) {
            const option = document.createElement('option');
            option.value = searchName;
            option.textContent = searchName;
            searchSelect.appendChild(option);
        }
        
        console.log('📋 Search select populated with', names.length, 'items');
    }

    function generateSurroundingFields() {
        const container = document.getElementById('surroundingFieldsContainer');
        if (!container) {
            console.error('❌ Error: surroundingFieldsContainer not found!');
            return;
        }
        
        container.innerHTML = ''; // Clear any existing fields
        
        for (let i = 1; i <= 20; i++) {
            const fieldNumber = String(i).padStart(2, '0');
            const div = document.createElement('div');
            div.className = 'mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200';
            div.innerHTML = `
                <label for="modal_surrounding_${fieldNumber}" class="block text-sm font-medium text-gray-700 mb-2">
                    <span class="text-purple-600 font-bold">#${fieldNumber}</span> ข้อมูลพลังตัวเลข:
                </label>
                <input type="text" id="modal_surrounding_${fieldNumber}" 
                       name="surrounding_${fieldNumber}"
                       placeholder="เช่น: เลขบ้าน, ทะเบียนรถ, เบอร์โทร..."
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 
                              focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all">
            `;
            container.appendChild(div);
        }
        
        console.log('✅ Generated 20 surrounding fields successfully');
    }

    function showLoading(show = true) {
        const loadingEl = document.getElementById('loadingIndicator');
        if (!loadingEl) {
            const div = document.createElement('div');
            div.id = 'loadingIndicator';
            div.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 hidden flex items-center justify-center z-50';
            div.innerHTML = `
                <div class="bg-white p-6 rounded-xl shadow-2xl mx-4">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
                    <p class="mt-4 text-center font-medium text-gray-700">กำลังคำนวณ...</p>
                </div>
            `;
            document.body.appendChild(div);
        }
        
        const el = document.getElementById('loadingIndicator');
        el.style.display = show ? 'flex' : 'none';
        console.log(show ? '⏳ Loading shown' : '✅ Loading hidden');
    }

    async function callLuckyNumberAPI(formData) {
        console.log('==================== API CALL START ====================');
        console.log('📤 Function: callLuckyNumberAPI()');
        console.log('📡 Endpoint:', LuckyNumber_FUNCTION);
        console.log('🕐 Time:', new Date().toLocaleString('th-TH'));
    
        try {
            showLoading(true);
 
            // Log raw input
            console.log('📥 Raw Input Data:', formData);
            console.log('📊 Data Types:');
            Object.entries(formData).forEach(([key, val]) => {
                console.log(`   ${key}: ${typeof val} = ${val}`);
            });

            const payload = {
                birth_day: String(formData.birth_day || ''),
                birth_month: String(formData.birth_month || ''),
                birth_century: String(formData.birth_century || '20'),
                birth_year: String(formData.birth_year || ''),
                birth_hour: String(formData.birth_hour || '00'),
                birth_minute: String(formData.birth_minute || '00'),
                // ข้อมูลวันเทียบ
                comparison_day: String(formData.comparison_day || ''),
                comparison_month: String(formData.comparison_month || ''),
                comparison_century: String(formData.comparison_century || '20'),
                comparison_year: String(formData.comparison_year || ''),
                comparison_hour: String(formData.comparison_hour || '00'),
                comparison_minute: String(formData.comparison_minute || '00'),
                option: 'BD', // ตั้งค่าเป็น BD เสมอ
                prophesy: "1" // ตั้งค่า prophesy
            };

            console.log('📦 FINAL PAYLOAD:');
            console.log('Method: POST');
            console.log('Content-Type: application/json');
            console.log('Body:', JSON.stringify(payload, null, 2));
        
            // Show payload size
            const payloadSize = JSON.stringify(payload).length;
            console.log(`📊 Payload size: ${payloadSize} bytes`);

            const response = await fetch(LuckyNumber_FUNCTION, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'apikey': window.SUPABASE_ANON_KEY || ''
                },
                body: JSON.stringify(payload),
                mode: 'cors',
                cache: 'no-cache'
            });

            console.log('📥 Response received:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                headers: Object.fromEntries([...response.headers.entries()])
            });

            if (!response.ok) {
                console.error('❌ Response NOT OK');
                const errorText = await response.text();
                console.error('Error body:', errorText);
            
                // Try to parse as JSON
                let errorDetails = errorText;
                try {
                    const errorJson = JSON.parse(errorText);
                    console.error('Parsed error JSON:', errorJson);
                    errorDetails = JSON.stringify(errorJson, null, 2);
                } catch (e) {
                    console.error('Could not parse error as JSON, using raw text');
                }
            
                throw new Error(`HTTP ${response.status}: ${response.statusText}\n\n${errorDetails}`);
            }

            const result = await response.json();
            console.log('✅ SUCCESS! Response data:', result);
        
            // **เปลี่ยน: ตอนนี้ response มีโครงสร้าง { success: true, results: [...] }**
            if (!result.success) {
                throw new Error(result.error || 'API call was not successful');
            }
        
            // Store in sessionStorage
            console.log('💾 Storing result in sessionStorage...');
            sessionStorage.setItem('psychomatrixResult', JSON.stringify(result));
            console.log('✅ Stored successfully');
        
            // Redirect
            // ใน callLuckyNumberAPI() function - หาส่วน redirect
            console.log('✅ SUCCESS! Response data:', result);

            // **เปลี่ยน: ส่ง option ผ่าน URL parameter แทน sessionStorage**
            const option = formData.option || 'BD';
            const redirectUrl = `Lucky_Number_Display.html?option=${encodeURIComponent(option)}`;

            console.log('🔄 Redirecting to:', redirectUrl);
            window.location.href = redirectUrl;

        } catch (error) {
            console.error('❌ CATCH BLOCK - API CALL FAILED:');
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Stack trace:', error.stack);
        
            showLoading(false);
        
            // Enhanced error message
            let errorMessage = error.message;
            if (error.message.includes('400')) {
                errorMessage += '\n\n💡 สาเหตุที่เป็นไปได้:\n' +
                           '1. ข้อมูลขาด field ที่จำเป็นต้องใช้งาน\n' +
                           '2. ชนิดข้อมูลไม่ถูกต้อง\n' +
                           '3. Edge Function ไม่พบ field ที่ต้องการ\n\n' +
                           '🔍 ตรวจสอบข้อมูลใน Debug Logger ที่มุมล่างขวา';
            }
        
            alert(`❌ เกิดข้อผิดพลาด:\n\n${errorMessage}`);
        } finally {
            console.log('==================== API CALL END ====================');
            setTimeout(() => showLoading(false), 1000);
        }
    }


    // ==================== FIXED FORM HANDLER ====================
    async function handleAnalyzeButton() {
        console.log('🎯 handleAnalyzeButton() called directly');
    
        const searchName = mainSearchNameInput.value.trim();
    
        // Validate required fields
        const birthDay = document.querySelector('select[name="birth_day"]').value;
        const birthMonth = document.querySelector('select[name="birth_month"]').value;
    
        if (!birthDay || !birthMonth) {
            alert('⚠️ กรุณากรอกวันเกิดให้ครบถ้วน');
            return;
        }

        // Prepare data for API
        const formData = {
            action: 'analyze',
            search_name: searchName,
            option: 'BD',
            use_average: false,
            birth_day: birthDay,
            birth_month: birthMonth,
            birth_century: document.querySelector('select[name="birth_century"]').value,
            birth_year: document.querySelector('select[name="birth_year"]').value,
            birth_hour: document.querySelector('select[name="birth_hour"]').value || '00',
            birth_minute: document.querySelector('select[name="birth_minute"]').value || '00',
            // ข้อมูลวันเทียบ
            comparison_day: document.querySelector('select[name="comparison_day"]').value,
            comparison_month: document.querySelector('select[name="comparison_month"]').value,
            comparison_century: document.querySelector('select[name="comparison_century"]').value,
            comparison_year: document.querySelector('select[name="comparison_year"]').value,
            comparison_hour: document.querySelector('select[name="comparison_hour"]').value || '00',
            comparison_minute: document.querySelector('select[name="comparison_minute"]').value || '00',
            prophesy: "1"
        };

        console.log('📦 COMPLETE FORM DATA:', formData);

        // Call API
        await callLuckyNumberAPI(formData);
    }


    // ==================== MAIN FORM HANDLER ====================
    async function handleFormSubmission(submitter) {
        console.log('🔧 handleFormSubmission() called with submitter:', submitter);
    
        const action = submitter ? submitter.value : '';
        const searchName = mainSearchNameInput.value.trim();
    
        console.log('📊 Action:', action, '| Search Name:', searchName);

        if (action === 'analyze') {
            // ==================== ANALYZE ACTION ====================
            console.log('🔮 Processing ANALYZE action...');

            // Validate required fields
            const birthDay = document.querySelector('select[name="birth_day"]').value;
            const birthMonth = document.querySelector('select[name="birth_month"]').value;
        
            if (!birthDay || !birthMonth) {
                alert('⚠️ กรุณากรอกวันเกิดให้ครบถ้วน');
                return;
            }

            // Prepare data for API
            const formData = {
                action: 'analyze',
                search_name: searchName,
                // ตั้งค่า option เป็น BD เสมอ (ฟอร์มมีแค่วันเกิด)
                option: 'BD',
                use_average: false,
                birth_day: birthDay,
                birth_month: birthMonth,
                birth_century: document.querySelector('select[name="birth_century"]').value,
                birth_year: document.querySelector('select[name="birth_year"]').value,
                birth_hour: document.querySelector('select[name="birth_hour"]').value || '00',
                birth_minute: document.querySelector('select[name="birth_minute"]').value || '00',
                // ข้อมูลวันเทียบ
                comparison_day: document.querySelector('select[name="comparison_day"]').value,
                comparison_month: document.querySelector('select[name="comparison_month"]').value,
                comparison_century: document.querySelector('select[name="comparison_century"]').value,
                comparison_year: document.querySelector('select[name="comparison_year"]').value,
                comparison_hour: document.querySelector('select[name="comparison_hour"]').value || '00',
                comparison_minute: document.querySelector('select[name="comparison_minute"]').value || '00',
                // ตั้งค่า prophesy เป็น 1 (เลขนำโชค-ปีวัฏจักร)
                prophesy: "1"
            };

            console.log('📦 COMPLETE FORM DATA:');
            console.log(JSON.stringify(formData, null, 2));

            // Call API
            console.log('🚀 Calling API with prepared data...');
            await callLuckyNumberAPI(formData);
        
        } else {
            console.warn('⚠️ Unknown action:', action);
        }
    }    

    // ==================== EVENT LISTENERS ====================

    // Form submission handling
    if (mainForm) {
    console.log('🎯 Setting up form submission handlers...');
    
    // เพิ่มการป้องกันการ submit ด้วย Enter
    mainForm.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            console.log('⏹️ Enter key prevented from submitting form');
        }
    });
    
    // จัดการปุ่ม analyze โดยตรง
    const analyzeBtn = mainForm.querySelector('button[value="analyze"]');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎯 Analyze button clicked directly');
            await handleAnalyzeButton();
        });
    }
}    

    // Load search modal
    if (loadMainButton && searchModal) {
        loadMainButton.addEventListener('click', function() {
            populateSearchSelect();
            searchModal.classList.remove('hidden');
            console.log('📂 Search modal opened');
        });
    }

    // Cancel search modal
    if (cancelSearchModalBtn && searchModal) {
        cancelSearchModalBtn.addEventListener('click', function() {
            searchModal.classList.add('hidden');
        });
    }

    // Select saved search
    if (selectSearchBtn && searchSelect ) {
        console.log ("Check selectSearchBtn click !" );
            
        selectSearchBtn.addEventListener('click', function() {
            const selected = searchSelect.value;
            
            console.log (`Selected search ! "${selected}"` );
            
            if (selected) {
                mainSearchNameInput.value = selected;
                searchModal.classList.add('hidden');
                loadData(selected);
            } else {
                alert('⚠️ กรุณาเลือกชื่อที่บันทึกไว้');
            }
        });
    }

    if (loadLocalStorageFileBtn && loadLocalStorageFileInput) {
        loadLocalStorageFileBtn.addEventListener('click', function() {
            loadLocalStorageFileInput.click();
        });

        loadLocalStorageFileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const fileContent = e.target.result;
                    const parsedData = JSON.parse(fileContent);
                    saveUserData(parsedData);
                    alert('✅ โหลดข้อมูลจากไฟล์สำเร็จ');
                    populateSearchSelect();
                    searchModal.classList.add('hidden');
                    console.log('📥 Data loaded from file:', Object.keys(parsedData).length, 'entries');
                } catch (error) {
                    console.error('❌ File parse error:', error);
                    alert('❌ ไฟล์ไม่ถูกต้อง ต้องเป็น JSON format');
                }
            };
            reader.readAsText(file);
        });
    }

    // ==================== INITIAL SETUP ====================
    
   
    // Populate search dropdown
    populateSearchSelect();
    
    // Log ready status
    console.log('📌 Debug Mode: Check console for all operations');

});
