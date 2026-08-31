document.addEventListener("DOMContentLoaded", () => {

    const inputFields = [
        { inputId: 'firstname', errorId: 'first_name_error' },
        { inputId: 'lastname', errorId: 'last_name_error' },
        { inputId: 'email', errorId: 'email_error' },
        { inputId: 'password', errorId: 'password_error' }
    ];

    // 2. วนลูปติดเรดาร์ดักจับการพิมพ์ให้ครบทุกช่อง
    inputFields.forEach(field => {
        const inputEl = document.getElementById(field.inputId);
        const errorEl = document.getElementById(field.errorId);

        // เช็กก่อนว่าหาหน้า HTML เจอไหม (กันเหนียว)
        if (inputEl && errorEl) {
            // เมื่อมีการพิมพ์ตัวอักษรลงไป ('input')
            inputEl.addEventListener('input', () => {

                // ถ้าช่องนั้นไม่ได้ว่างเปล่าแล้ว (เริ่มมีตัวอักษร)
                if (inputEl.value.trim() !== "") {
                    // ซ่อนข้อความเตือน
                    errorEl.classList.add('hidden');
                    // ล้างสีกรอบแดงๆ และพื้นหลังสีแดงออกไป
                    inputEl.classList.remove('border-red-500', 'focus:ring-red-500', 'bg-red-50');
                }
            });
        }
    });

    // 3. สั่งให้ปุ่มรอรับการ 'คลิก'
    const signUpButton = document.getElementById("signup-btn");
    signUpButton.addEventListener("click", async () => {

        // 2. ดึง "ตัวช่องกรอก" (Element) และ "ค่า" (Value) มาเตรียมไว้
        const firstNameInput = document.getElementById('firstname');
        const lastNameInput = document.getElementById('lastname');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        // ใช้ .trim() เพื่อตัดช่องว่าง (Spacebar) เผื่อผู้ใช้เผลอกดเว้นวรรค
        const first_name = firstNameInput.value.trim();
        const last_name = lastNameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const roleValue = parseInt(document.querySelector('input[name="role"]:checked').value);

        // 3. ดึง "ข้อความแจ้งเตือน" (ที่ซ่อนไว้) มารอไว้
        const firstNameError = document.getElementById('first_name_error');
        const lastNameError = document.getElementById('last_name_error');
        const emailError = document.getElementById('email_error');
        const passwordError = document.getElementById('password_error');

        let isValid = true;

        // 4. ฟังก์ชันตัวช่วย จัดการเรื่องสีกรอบและข้อความ (จะได้ไม่ต้องเขียนโค้ดซ้ำ 4 รอบ)
        const validateField = (value, inputEl, errorEl) => {
            if (!value) {
                errorEl.classList.remove('hidden');
                isValid = false;
            } else {
                errorEl.classList.add('hidden');
            }
        };

        // 5. สั่งรันเช็กทีละช่องไปเลย!
        validateField(first_name, firstNameInput, firstNameError);
        validateField(last_name, lastNameInput, lastNameError);
        validateField(email, emailInput, emailError);
        validateField(password, passwordInput, passwordError);

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) {
            const emailError = document.getElementById('email_error');
            emailError.innerText = "รูปแบบอีเมลไม่ถูกต้อง";
            emailError.classList.remove('hidden');
            isValid = false;
        }

        if (password && password.length < 6) {
            const passError = document.getElementById('password_error');
            passError.innerText = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
            passError.classList.remove('hidden');
            isValid = false;
        }

        if (!isValid) {
            console.log("ข้อมูลไม่ครบ หยุดการส่งข้อมูล!");
            return;
        }

        // --- เริ่มต้นกระบวนการสมัครสมาชิกกับ Supabase ---
        console.log("ข้อมูลครบถ้วน กำลังสมัครสมาชิก...");
        console.log("กำลังสมัครสมาชิก...");

        const { data, error } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password
        });


        if (error) {
            if (error.status === 422 || error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already exists')) {
                // ทำให้ช่องอีเมลเป็นกรอบสีแดง
                document.getElementById('email').classList.add('border-red-500', 'focus:ring-red-500', 'bg-red-50');
                const emailError = document.getElementById('email_error');
                emailError.innerText = "อีเมลนี้มีผู้ใช้งานแล้ว กรุณาใช้อีเมลอื่น";
                emailError.classList.remove('hidden');
                
                // เอา console.log ออกมาดูให้ชัวร์
                console.log("ตรวจพบอีเมลซ้ำ:", error.message);
            } 
            else {
                // ถ้าเป็น Error อื่นๆ (เช่น เน็ตหลุด, เซิร์ฟเวอร์ล่ม)
                alert('เกิดข้อผิดพลาดในการสมัคร: ' + error.message);
            }
            return;
        }

        if (data.user) {
            // สเตปที่ 1: บันทึกข้อมูลพื้นฐานลงตาราง 'users' (ส่งไปแค่อีเมลกับไอดี)
            const { error: userError } = await window.supabaseClient
                .from('users')
                .insert([
                    {
                        user_id: data.user.id,
                        first_name: first_name,
                        last_name: last_name,
                        email: email
                    }
                ]);

            if (userError) {
                console.error("พังที่ตาราง users:", userError);
                alert("บันทึกข้อมูลผู้ใช้ไม่สำเร็จ");
                return;
            }

            // สเตปที่ 2: บันทึกตำแหน่งลงตาราง 'user_role'
            const { error: roleError } = await window.supabaseClient
                .from('user_role')
                .insert([
                    {
                        user_id: data.user.id,
                        role_id: roleValue
                    }
                ]);

            if (roleError) {
                console.error("พังที่ตาราง user_role:", roleError);
                alert("สมัครสำเร็จ แต่บันทึกตำแหน่ง (Role) ไม่สำเร็จ");
            } else {
                window.location.href = "./index.html";
            }
        }
    });
});

const supabaseClient = window.supabaseClient;