require('dotenv').config();
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
// ... باقي الكود

if (!EMAIL_USER || !EMAIL_PASS) {
  console.error('⚠️ EMAIL_USER or EMAIL_PASS not set in environment variables');
}


// ========== بيانات البريد الثابتة (مؤقتاً) ==========
// const EMAIL_USER = "3elhajj@gmail.com";
// const EMAIL_PASS = "wynxigcoegarzyjd";   // كلمة مرور التطبيق (App Password)

// ========== دوال مساعدة ==========
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  try {
    if (!EMAIL_USER || !EMAIL_PASS) {
      console.warn('⚠️ Email credentials missing');
      return null;
    }
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: EMAIL_USER, pass: EMAIL_PASS }
    });
    console.log('✅ Email transporter created successfully');
    return transporter;
  } catch (err) {
    console.error('❌ Error creating email transporter:', err.message);
    return null;
  }
}

// ========== 1. إرسال كود التفعيل ==========
exports.sendVerificationCode = functions.https.onCall(async (data, context) => {
  console.log("🚀 sendVerificationCode started");
  
  let email = data?.email || data?.data?.email;
  let uid = data?.uid || data?.data?.uid;
  
  console.log("📨 Extracted:", { email, uid });

  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'البريد الإلكتروني مطلوب');
  }

  let finalUid = uid;
  if (!finalUid) {
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      finalUid = userRecord.uid;
    } catch (err) {
      console.error("❌ Failed to get uid:", err.message);
      throw new functions.https.HttpsError('not-found', 'لا يوجد مستخدم بهذا البريد');
    }
  }

  // التحقق من وجود المستخدم
  try {
    const userRecord = await admin.auth().getUser(finalUid);
    if (userRecord.email !== email) throw new Error("Email mismatch");
  } catch (err) {
    console.error("❌ Invalid user:", err.message);
    throw new functions.https.HttpsError('not-found', 'بيانات المستخدم غير صحيحة');
  }

  // منع التكرار (مرة كل دقيقة)
  const codeDocRef = admin.firestore().collection('verificationCodes').doc(finalUid);
  const codeSnap = await codeDocRef.get();
  const now = Date.now();

  if (codeSnap.exists) {
    const lastSent = codeSnap.data().lastSentAt?.toMillis?.() || 0;
    if (now - lastSent < 60000) {
      throw new functions.https.HttpsError('failed-precondition', 'الرجاء الانتظار دقيقة قبل طلب كود جديد');
    }
  }

  const code = generateVerificationCode();
  const expiresAt = admin.firestore.Timestamp.fromMillis(now + 10 * 60 * 1000);

  await codeDocRef.set({
    code,
    email,
    expiresAt,
    lastSentAt: admin.firestore.FieldValue.serverTimestamp(),
    attempts: 0
  }, { merge: true });
  console.log("✅ Code saved to Firestore");

  // إرسال البريد الإلكتروني
  let emailSent = false;
  try {
    const transporter = getTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: `"MarsGo" <${EMAIL_USER}>`,
        to: email,
        subject: 'رمز تفعيل حساب MarsGo',
        html: `
          <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; direction: rtl; text-align: right; padding: 20px; background-color: #f9f9f9;">
            <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #4f46e5;">مرحباً بك في MarsGo</h2>
              <p>استخدم الرمز التالي لتفعيل حسابك. الرمز صالح لمدة 10 دقائق:</p>
              <div style="background: #f0f0f0; font-size: 28px; font-weight: bold; text-align: center; padding: 15px; margin: 20px 0; letter-spacing: 8px; border-radius: 8px; direction: ltr;">
                ${code}
              </div>
              <p>إذا لم تقم بطلب التفعيل، يرجى تجاهل هذه الرسالة.</p>
              <hr style="margin: 20px 0;">
              <p style="font-size: 12px; color: #aaa;">هذه رسالة آلية من MarsGo – لا ترد على هذا البريد.</p>
            </div>
          </div>
        `,
      });
      emailSent = true;
      console.log(`✅ Email sent to ${email} with code ${code}`);
    } else {
      console.warn("⚠️ No transporter available");
    }
  } catch (err) {
    console.error("❌ Email sending failed:", err.message);
  }

  return { success: true, emailSent, uid: finalUid };
});

// ========== 2. التحقق من كود التفعيل (مع تفعيل الحساب وإنشاء وثيقة المستخدم) ==========
exports.verifyCode = functions.https.onCall(async (data, context) => {
  let email = data?.email || data?.data?.email;
  let uid = data?.uid || data?.data?.uid;
  let code = data?.code || data?.data?.code;

  if (!email) throw new functions.https.HttpsError('invalid-argument', 'البريد الإلكتروني مطلوب');
  if (!uid) throw new functions.https.HttpsError('invalid-argument', 'معرف المستخدم (UID) مطلوب');
  if (!code) throw new functions.https.HttpsError('invalid-argument', 'رمز التفعيل مطلوب');

  const codeDocRef = admin.firestore().collection('verificationCodes').doc(uid);
  const codeSnap = await codeDocRef.get();
  if (!codeSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'لم يتم طلب كود تفعيل لهذا الحساب');
  }

  const record = codeSnap.data();
  if (record.email !== email) {
    throw new functions.https.HttpsError('permission-denied', 'البريد الإلكتروني غير متطابق');
  }
  if (record.expiresAt?.toMillis?.() < Date.now()) {
    await codeDocRef.delete();
    throw new functions.https.HttpsError('deadline-exceeded', 'انتهت صلاحية الكود. يرجى طلب كود جديد');
  }

  const attempts = (record.attempts || 0) + 1;
  if (attempts > 3) {
    await codeDocRef.delete();
    throw new functions.https.HttpsError('failed-precondition', 'تم تجاوز عدد المحاولات. يرجى طلب كود جديد');
  }
  if (record.code !== code) {
    await codeDocRef.update({ attempts });
    throw new functions.https.HttpsError('invalid-argument', 'الكود غير صحيح');
  }

  // تفعيل حساب Firebase Auth
  try {
    await admin.auth().updateUser(uid, { disabled: false, emailVerified: true });
    console.log("✅ Auth user enabled and emailVerified set to true");
  } catch (authErr) {
    console.error("⚠️ Auth update failed:", authErr.message);
    throw new functions.https.HttpsError('internal', 'فشل تحديث حالة الحساب');
  }

  // إنشاء وثيقة المستخدم في Firestore
  const userRef = admin.firestore().collection('users').doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    await userRef.set({
      email: email,
      emailVerified: true,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      balance: 0,
      role: 'user'
    });
    console.log("✅ Firestore user document created");
  } else {
    await userRef.update({
      emailVerified: true,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("✅ Firestore user document updated");
  }

  await codeDocRef.delete();
  return { success: true, message: 'تم تفعيل حسابك بنجاح! يمكنك الآن تسجيل الدخول.' };
});

// ========== 3. تعطيل حساب المستخدم (للاستدعاء بعد إنشاء الحساب مباشرة) ==========
exports.disableUser = functions.https.onCall(async (data, context) => {
  const { uid } = data;
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'UID مطلوب');
  }
  // اختياري: يمكن إضافة تحقق من المصادقة إذا أردت منع استدعاء هذه الدالة من أي شخص
  // لكن بما أننا سنستدعيها بعد إنشاء الحساب مباشرة من العميل، نسمح بذلك.
  try {
    await admin.auth().updateUser(uid, { disabled: true });
    console.log(`✅ User ${uid} disabled successfully`);
    return { success: true };
  } catch (error) {
    console.error("❌ Disable user failed:", error.message);
    throw new functions.https.HttpsError('internal', 'فشل تعطيل الحساب');
  }
});

// ========== 4. التحقق من حالة التفعيل ==========
// ========== 3. التحقق من حالة التفعيل ==========
exports.checkEmailVerified = functions.https.onCall(async (data, context) => {
  // قبول البيانات سواء مباشرة أو داخل data.data
  let uid = data?.uid || data?.data?.uid;
  
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'UID مطلوب');
  }
  if (!context.auth || context.auth.uid !== uid) {
    throw new functions.https.HttpsError('permission-denied', 'غير مصرح');
  }
  const userRecord = await admin.auth().getUser(uid);
  return { verified: userRecord.emailVerified };
});

// ========== 5. إرسال كود إعادة تعيين كلمة المرور ==========
// ========== 4. إرسال كود إعادة تعيين كلمة المرور (بمرونة في استقبال البيانات) ==========
exports.sendPasswordResetCode = functions.https.onCall(async (data, context) => {
  // قبول البيانات سواء مباشرة أو داخل data.data
  let email = data?.email || data?.data?.email;
  
  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'البريد الإلكتروني مطلوب');
  }

  let uid;
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    uid = userRecord.uid;
  } catch (err) {
    console.log(`Password reset requested for non-existent email: ${email}`);
    return { success: true, message: 'إذا كان البريد موجوداً، تم إرسال الكود.' };
  }

  const codeDocRef = admin.firestore().collection('passwordResets').doc(uid);
  const codeSnap = await codeDocRef.get();
  const now = Date.now();
  if (codeSnap.exists) {
    const lastSent = codeSnap.data().lastSentAt?.toMillis?.() || 0;
    if (now - lastSent < 60000) {
      throw new functions.https.HttpsError('failed-precondition', 'الرجاء الانتظار دقيقة قبل طلب كود جديد');
    }
  }

  const code = generateVerificationCode();
  const expiresAt = admin.firestore.Timestamp.fromMillis(now + 10 * 60 * 1000);

  await codeDocRef.set({
    code,
    email,
    expiresAt,
    lastSentAt: admin.firestore.FieldValue.serverTimestamp(),
    attempts: 0
  }, { merge: true });

  let emailSent = false;
  try {
    const transporter = getTransporter();
    if (transporter) {
    await transporter.sendMail({
  from: `"MarsGo" <${EMAIL_USER}>`,
  to: email,
  subject: 'إعادة تعيين كلمة المرور في MarsGo',
  html: `
    <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; direction: rtl; text-align: right; padding: 20px; background-color: #f9f9f9;">
      <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #4f46e5;">إعادة تعيين كلمة المرور</h2>
        <p>استخدم الرمز التالي لإعادة تعيين كلمة المرور. الرمز صالح لمدة 10 دقائق:</p>
        <div style="background: #f0f0f0; font-size: 28px; font-weight: bold; text-align: center; padding: 15px; margin: 20px 0; letter-spacing: 8px; border-radius: 8px; direction: ltr;">
          ${code}
        </div>
        <p>إذا لم تطلب إعادة التعيين، يمكنك تجاهل هذه الرسالة.</p>
        <hr>
        <p style="font-size: 12px; color: #aaa;">رسالة آلية من MarsGo – لا ترد على هذا البريد.</p>
      </div>
    </div>
  `,
});
      emailSent = true;
      console.log(`✅ Password reset email sent to ${email}`);
    } else {
      console.log(`⚠️ No transporter, reset code for ${email}: ${code}`);
    }
  } catch (err) {
    console.error('Email sending failed:', err);
  }

  return { success: true, emailSent };
});

// ========== 6. التحقق من كود إعادة التعيين وتحديث كلمة المرور ==========
// ========== 5. التحقق من كود إعادة التعيين وتحديث كلمة المرور (بمرونة) ==========
// ========== 5. التحقق من كود إعادة التعيين وتحديث كلمة المرور (نسخة مستقرة) ==========
exports.verifyPasswordResetCode = functions.https.onCall(async (data, context) => {
  // استقبال البيانات بأي تنسيق (مباشر أو داخل data.data)
  let email = data?.email || data?.data?.email;
  let code = data?.code || data?.data?.code;
  let newPassword = data?.newPassword || data?.data?.newPassword;

  if (!email) throw new functions.https.HttpsError('invalid-argument', 'البريد الإلكتروني مطلوب');
  if (!code) throw new functions.https.HttpsError('invalid-argument', 'رمز التحقق مطلوب');
  if (!newPassword) throw new functions.https.HttpsError('invalid-argument', 'كلمة المرور الجديدة مطلوبة');
  if (newPassword.length < 6) {
    throw new functions.https.HttpsError('invalid-argument', 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
  }

  let uid;
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    uid = userRecord.uid;
  } catch (err) {
    throw new functions.https.HttpsError('not-found', 'لا يوجد حساب مرتبط بهذا البريد');
  }

  const codeDocRef = admin.firestore().collection('passwordResets').doc(uid);
  const codeSnap = await codeDocRef.get();

  if (!codeSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'لم يتم طلب كود إعادة تعيين لهذا الحساب');
  }

  const record = codeSnap.data();
  if (record.expiresAt?.toMillis?.() < Date.now()) {
    await codeDocRef.delete();
    throw new functions.https.HttpsError('deadline-exceeded', 'انتهت صلاحية الكود. يرجى طلب كود جديد');
  }

  const attempts = (record.attempts || 0) + 1;
  if (attempts > 3) {
    await codeDocRef.delete();
    throw new functions.https.HttpsError('failed-precondition', 'تم تجاوز عدد المحاولات. يرجى طلب كود جديد');
  }
  if (record.code !== code) {
    await codeDocRef.update({ attempts });
    throw new functions.https.HttpsError('invalid-argument', 'الكود غير صحيح');
  }

  await admin.auth().updateUser(uid, { password: newPassword });
  await codeDocRef.delete();

  return { success: true, message: 'تم تغيير كلمة المرور بنجاح' };
});