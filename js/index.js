document.addEventListener("DOMContentLoaded", () => {
    const loginButton = document.getElementById("login-btn");

    if (loginButton) {
        loginButton.addEventListener("click", async () => {
            // 1. ดึงค่าจากช่องกรอก
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            
            // เช็กช่องว่าง
            if (!email || !password) {
                if (!email) {
                    document.getElementById('email_error').innerText = "กรุณากรอกอีเมล";
                    document.getElementById('email_error').classList.remove('hidden');
                } 
                
                if (!password) {
                    document.getElementById('password_error').innerText = "กรุณากรอกรหัสผ่าน";
                    document.getElementById('password_error').classList.remove('hidden');
                } 
                return;
            }

            console.log("กำลังตรวจสอบข้อมูลเข้าสู่ระบบ...");
            
            // 2. ส่งให้ Supabase ตรวจสอบ
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            // 3. ดักจับกรณีที่ "รหัสผิด" หรือ "อีเมลไม่มีในระบบ"
            if (error) {
                console.error("เข้าสู่ระบบไม่สำเร็จ:", error.message);
                
                const loginError = document.getElementById('login_error');
                if (loginError) {
                    loginError.innerText = "อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง";
                    loginError.classList.remove('hidden');

                    document.getElementById('email_error').classList.add('hidden');
                    document.getElementById('password_error').classList.add('hidden');
                } else {
                    alert("อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
                }
                return;
            }

            // 4. ถ้าผ่านลงมาถึงตรงนี้แปลว่า "อีเมลมีจริง และ รหัสผ่านตรง"
            if (data.user) {
                console.log("เข้าสู่ระบบสำเร็จ!");

                const { data: roleData, error: roleError } = await window.supabaseClient
                    .from('user_role')
                    .select('role_id')
                    .eq('user_id', data.user.id)
                    .single();

                if (roleError || !roleData) {
                    console.error("ไม่พบข้อมูลสิทธิ์:", roleError?.message);
                    alert("เกิดข้อผิดพลาด: ไม่พบสิทธิ์การเข้าใช้งานของบัญชีนี้");
                    return;
                }

                const roleId = roleData.role_id;

                if (roleId === 1) {
                    window.location.href = "./dashboard-student.html"; //หน้านิสิต
                } else if (roleId === 2) {
                    window.location.href = "./dashboard-teacher.html"; //หน้าอาจารย์
                } else if (roleId === 3) {
                    window.location.href = "./dashboard-admin.html"; //หน้าผู้ดูแลระบบ
                } else {
                    alert("สิทธิ์ผู้ใช้งานไม่ถูกต้องในระบบ");
                }
            }
        });
    }
});