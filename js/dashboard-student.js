document.addEventListener("DOMContentLoaded", async () => {
    const projectContainer = document.getElementById("project-container");
    const createBtn = document.getElementById("create-project-btn");

    const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();

    if (sessionError || !session) {
        alert("กรุณาเข้าสู่ระบบก่อนใช้งาน");
        window.location.href = "./index.html"; // เตะกลับไปหน้าล็อกอิน
        return;
    }

    const userId = session.user.id;

    // ฟังก์ชัน: 1. ดึงข้อมูลจาก Supabase มาแสดงผล await window.supabaseClient
    const loadProjects = async () => {
        // ดึงข้อมูลทั้งหมดจากตาราง 'projects' เรียงจากใหม่ไปเก่า

        const { data: responsibilities, error } = await window.supabaseClient
            .from('responsible_for')
            .select(`
                project (
                    project_id,
                    thai_project_title,
                    academic_year,
                    status,
                    created_at
                )
            `)
            .eq('user_id', userId

            );

        if (error) {
            console.error("ดึงข้อมูลล้มเหลว:", error.message);
            return;
        }

        let project = responsibilities.map(item => item.project).filter(p => p !== null);
        project.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        // ล้างกล่องให้ว่างก่อนใส่ของใหม่
        projectContainer.innerHTML = "";

        // วนลูปข้อมูลที่ได้มา สร้างเป็นการ์ดทีละใบ
        project.forEach(project => {
            // จัดการรูปแบบวันที่ (DD-MM-YYYY)
            // const dateObj = new Date(project.created_at);
            const dateObj = project.created_at ? new Date(project.created_at) : new Date();
            const dateStr = `${String(dateObj.getDate()).padStart(2, '0')}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${dateObj.getFullYear()}`;

            // กำหนดสีของสถานะ (Badge)
            let statusColors = project.status === "ผ่าน"
                ? "bg-[#dcfce7] text-[#16a34a]"
                : "bg-red-100 text-red-500"; // ค่าเริ่มต้นคือ ต้องแก้ไข

            // สร้าง HTML การ์ด
            const cardHTML = `
                <div id="project-card-${project.project_id}" class="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] shadow-xl p-8 relative group border border-gray-50 hover:-translate-y-2 transition-all cursor-pointer min-h-[180px]">
                    <div class="absolute top-4 right-4">
                        <button onclick="toggleDeletePopup('popup-${project.project_id}')" class="bg-[#f8f9fc] shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-xl w-8 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M273.02-428q-21.54 0-36.66-15.34-15.13-15.34-15.13-36.87 0-21.54 15.34-36.66Q251.91-532 273.44-532q21.54 0 36.67 15.34 15.12 15.34 15.12 36.87 0 21.54-15.34 36.66Q294.56-428 273.02-428Zm206.77 0q-21.54 0-36.66-15.34Q428-458.68 428-480.21q0-21.54 15.34-36.66Q458.68-532 480.21-532q21.54 0 36.66 15.34Q532-501.32 532-479.79q0 21.54-15.34 36.66Q501.32-428 479.79-428Zm206.77 0q-21.54 0-36.67-15.34-15.12-15.34-15.12-36.87 0-21.54 15.34-36.66Q665.44-532 686.98-532t36.66 15.34q15.13 15.34 15.13 36.87 0 21.54-15.34 36.66Q708.09-428 686.56-428Z"/></svg>
                        </button>
                    </div>

                    <div id="popup-${project.project_id}" class="hidden absolute top-11 right-4 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.15)] border border-gray-100 px-6 py-5 w-[280px] z-20 cursor-default">
                        <p class="text-[15px] font-medium text-gray-800 mb-6 text-center">คุณต้องการลบโครงงานหรือไม่ ?</p>
                        <div class="flex justify-end gap-5">
                            <button onclick="toggleDeletePopup('popup-${project.project_id}')" class="text-sm font-medium text-gray-700 hover:text-black transition-colors">
                                    ยกเลิก
                            </button>
                            <button onclick="deleteProject('${project.project_id}')" class="text-sm font-medium text-[#c81e1e] hover:text-red-800 transition-colors">
                                    ยืนยัน
                            </button>
                        </div>
                    </div>

                    <div class="flex justify-between items-center mt-4 mb-6">
                        <span class="text-xs text-gray-500 font-medium">${dateStr}</span>
                        <span class="px-3 py-1 ${statusColors} text-[10px] font-bold rounded-full">${project.status}</span>
                        </div>
                            <p class="text-[13px] text-gray-800 font-semibold leading-relaxed">
                            ${project.thai_project_title}
                        </p>
                    </div>
                </div>
            `;

            projectContainer.insertAdjacentHTML("beforeend", cardHTML);
        });
    };

    // 2. สร้างโครงงานใหม่ (Insert ลง Supabase)

    const modal = document.getElementById('project-modal');
    const form = document.getElementById('create-project-form');
    const closeBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    // เปิด Modal
    createBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
    });

    // ปิด Modal
    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        form.reset(); // ล้างข้อมูลในฟอร์มเมื่อกดปิด
    });
    
    cancelBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        form.reset(); // ล้างข้อมูลในฟอร์มเมื่อกดปิด
    });

    // เมื่อกดปุ่ม "สร้างโครงงาน" ใน Modal
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // ป้องกันหน้าเว็บรีเฟรช

        const thaiTitle = document.getElementById('thai-title').value.trim();
        const engTitle = document.getElementById('eng-title').value.trim();
        const academicYear = document.getElementById('academic-year').value.trim();
        const advisorEmail = document.getElementById('advisor-email').value.trim();

        // แยกอีเมลเพื่อนร่วมทีม
        const teamEmailsRaw = document.getElementById('team-emails').value;
        const teamEmails = teamEmailsRaw ? teamEmailsRaw.split(',').map(email => email.trim()).filter(email => email !== "") : [];

        // 🌟 สเตป 1: สร้างโครงงานลงตาราง project
        const { data: newProject, error: projectError } = await window.supabaseClient
            .from('project')
            .insert([{
                thai_project_title: thaiTitle,
                english_project_title: engTitle,
                academic_year: academicYear,
                status: "กำลังดำเนิน"
            }])
            .select();

        if (projectError) {
            alert("สร้างโครงงานล้มเหลว: " + projectError.message);
            return;
        }

        const projectId = newProject[0].project_id;

        // 🌟 สเตป 2: รวบรวมอีเมลทั้งหมดที่ต้องดึงเข้าโครงงาน (เพื่อน + อาจารย์)
        const allEmails = [...teamEmails];
        if (advisorEmail) allEmails.push(advisorEmail);

        // เตรียม Array สำหรับบันทึกลงตาราง responsibility (ใส่คนสร้างเข้าไปเป็นคนแรกเสมอ!)
        let responsibilityData = [
            { user_id: userId, project_id: projectId }
        ];

        // 🌟 สเตป 3: ไปค้นหา user_id ของเพื่อนและอาจารย์จากตาราง users
        if (allEmails.length > 0) {
            const { data: foundUsers, error: userError } = await window.supabaseClient
                .from('users') // ⚠️ เปลี่ยนชื่อตารางเป็นชื่อที่คุณใช้เก็บข้อมูลผู้ใช้ (ที่มีคอลัมน์ email และ user_id)
                .select('user_id, email')
                .in('email', allEmails);

            if (!userError && foundUsers) {
                // เอา user_id ของคนที่เจอในระบบ มาต่อท้ายใน Array
                foundUsers.forEach(user => {
                    responsibilityData.push({ user_id: user.user_id, project_id: projectId });
                });

                // (เสริม) แจ้งเตือนถ้ามีอีเมลไหนที่ยังไม่ได้สมัครสมาชิก
                if (foundUsers.length < allEmails.length) {
                    alert("มีอีเมลบางคนยังไม่ได้สมัครสมาชิก ระบบจะเพิ่มเฉพาะคนที่มีบัญชีเท่านั้น");
                }
            }
        }

        // 🌟 สเตป 4: บันทึกทุกคนลงตาราง responsibility พร้อมกัน!
        const { data: respData, error: respError } = await window.supabaseClient
            .from('responsible_for')
            .insert(responsibilityData)
            .select();

        if (respError) {
            console.error("บันทึกสมาชิกทีมล้มเหลว:", respError.message);
        }

        // ปิด Modal, ล้างฟอร์ม, และโหลดข้อมูลการ์ดใหม่
        modal.classList.add('hidden');
        form.reset();
        loadProjects();
    });
    loadProjects();
});

// ฟังก์ชันเปิด/ปิด Popup
window.toggleDeletePopup = function (popupId) {
    const popup = document.getElementById(popupId);
    if (popup) {
        popup.classList.toggle('hidden');
    }
};

// ฟังก์ชันลบข้อมูลโครงงานจาก Supabase และหน้าเว็บ
window.deleteProject = async function (projectId) {
    if (!confirm("ยืนยันการลบโครงงานนี้อย่างถาวร?")) return;

    try {
        // 1. สั่งลบความสัมพันธ์ในตาราง responsible_for ก่อน
        const { error: relError } = await window.supabaseClient
            .from('responsible_for')
            .delete()
            .eq('project_id', projectId); // เช็คให้แน่ใจว่าคอลัมน์ชื่อ project_id

        if (relError) throw relError;

        // 2. เมื่อลบลูกออกแล้ว ค่อยสั่งลบตัวโครงงานหลัก
        const { error: projError } = await window.supabaseClient
            .from('project')
            .delete()
            .eq('project_id', projectId);

        if (projError) throw projError;

        // 3. ซ่อน Popup ก่อนลบการ์ด (เพื่อความสวยงาม)
        const popup = document.getElementById(`popup-${projectId}`);
        if (popup) popup.classList.add('hidden');

        // 4. ลบการ์ดในหน้าเว็บให้จางหายไป
        const card = document.getElementById(`project-card-${projectId}`);
        if (card) {
            card.style.opacity = '0';
            setTimeout(() => {
                card.remove();
            }, 300);
        }
    } catch (err) {
        console.error("เกิดข้อผิดพลาดในการลบ:", err.message);
        alert("ไม่สามารถลบโครงงานได้: " + err.message);
    }
};