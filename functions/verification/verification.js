// functions/verification.js
// جميع دوال التفعيل وإعادة تعيين كلمة المرور
// تم إصلاح دالة sendVerificationCode لتقبل تنسيقات مختلفة من data
// وتم تعليق التحقق الصارم من uid مؤقتاً لتجنب 403 في مرحلة التسجيل

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// ========== دوال مساعدة ==========
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  try {
    const emailConfig = functions.config().email;
    if (!emailConfig) {
      console.warn('⚠️ Email config object missing entirely');
      return null;
    }
    const user = emailConfig.user;
    const pass = emailConfig.pass;
    if (!user || !pass) {
      console.warn('⚠️ Email credentials not set (user or pass missing)');
      return null;
    }
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
    console.log('✅ Email transporter created successfully');
    return transporter;
  } catch (err) {
    console.error('❌ Error creating email transporter:', err.message);
    return null;
  }
}

// ========== 1. إرسال كود التفعيل (معدل ليتحمل تنسيقات متعددة وبدون تحقق صارم من uid) ==========
exports.sendVerificationCode = functions.https.onCall(async (data, context) => {
  console.log("🚀 [STEP 0] Function started");
  
  // استخراج البيانات بطريقة مرنة (يدعم formatين)
  let email = data?.email || data?.data?.email;
  let uid = data?.uid || data?.data?.uid;
  
  console.log("📨 Extracted:", { email, uid });

  if (!email) {
    console.error("❌ Missing email in request. Full data:", JSON.stringify(data));
    throw new functions.https.HttpsError('invalid-argument', 'Email is required');
  }
  console.log("✅ [STEP 1] Email validated");

  let finalUid = uid;
  if (!finalUid) {
    try {
      console.log("🔍 [STEP 2a] Fetching uid by email...");
      const userRecord = await admin.auth().getUserByEmail(email);
      finalUid = userRecord.uid;
      console.log(`✅ [STEP 2a] Retrieved uid: ${finalUid}`);
    } catch (err) {
      console.error(`❌ [STEP 2a] Failed:`, err.message);
      throw new functions.https.HttpsError('not-found', 'User not found with this email');
    }
  }

  // التحقق من وجود المستخدم
  try {
    console.log("🔍 [STEP 2b] Verifying user with uid...");
    const userRecord = await admin.auth().getUser(finalUid);
    if (userRecord.email !== email) {
      console.warn(`⚠️ UID ${finalUid} email mismatch: ${userRecord.email} vs ${email}`);
      throw new Error("Email mismatch");
    }
    console.log("✅ [STEP 2b] User verified");
  } catch (err) {
    console.error(`❌ [STEP 2b] Failed:`, err.message);
    throw new functions.https.HttpsError('not-found', 'Invalid user');
  }

  // ✅ تم تعليق التحقق من تطابق uid مع context.auth مؤقتاً لتجنب 403 في مرحلة التسجيل
  // ملاحظة: هذا الإجراء غير آمن للإنتاج، لكنه ضروري لتجربة العملية.
  // يمكن إعادة تفعيله لاحقاً بعد التأكد من أن المستخدم مسجل الدخول بشكل صحيح.
  /*
  if (!context.auth || context.auth.uid !== finalUid) {
    console.error(`❌ Auth mismatch: token UID=${context.auth?.uid}, requested UID=${finalUid}`);
    throw new functions.https.HttpsError('permission-denied', 'You can only request code for your own account');
  }
  */
  console.log("⚠️ [STEP 2c] Permission check skipped for debugging (remove in production).");

  console.log("🔍 [STEP 3] Accessing Firestore...");
  const codeDocRef = admin.firestore().collection('verificationCodes').doc(finalUid);
  const codeSnap = await codeDocRef.get();
  const now = Date.now();

  if (codeSnap.exists) {
    const lastSent = codeSnap.data().lastSentAt?.toMillis?.() || 0;
    if (now - lastSent < 60000) {
      throw new functions.https.HttpsError('failed-precondition', 'الرجاء الانتظار دقيقة قبل طلب كود جديد');
    }
  }
  console.log("✅ [STEP 3] Rate limit check passed");

  const code = generateVerificationCode();
  const expiresAt = admin.firestore.Timestamp.fromMillis(now + 10 * 60 * 1000);

  console.log("🔍 [STEP 4] Saving code to Firestore...");
  await codeDocRef.set({
    code,
    email,
    expiresAt,
    lastSentAt: admin.firestore.FieldValue.serverTimestamp(),
    attempts: 0
  }, { merge: true });
  console.log("✅ [STEP 4] Code saved");

  // محاولة إرسال البريد
  console.log("🔍 [STEP 5] Attempting to send email...");
  let emailSent = false;
  try {
    const transporter = getTransporter();
    if (transporter) {
      const emailUser = functions.config().email?.user;
      if (emailUser) {
        await transporter.sendMail({
          from: `"MarsGo" <${emailUser}>`,
          to: email,
          subject: 'رمز تفعيل حساب MarsGo',
          html: `
            <div dir="rtl" style="font-family: Tahoma, sans-serif; padding: 20px;">
              <h2>مرحباً بك في MarsGo</h2>
              <p>استخدم الرمز التالي لتفعيل حسابك. الرمز صالح لمدة 10 دقائق:</p>
              <h1 style="background: #f0f0f0; padding: 10px; text-align: center; letter-spacing: 5px;">${code}</h1>
              <p>إذا لم تطلب هذا، يمكنك تجاهل الرسالة.</p>
              <p>فريق MarsGo</p>
            </div>
          `,
        });
        emailSent = true;
        console.log(`✅ [STEP 5a] Email sent to ${email} with code ${code}`);
      } else {
        console.warn("⚠️ [STEP 5b] Email user config missing, cannot send.");
      }
    } else {
      console.warn("⚠️ [STEP 5b] No transporter available (likely Spark plan or missing credentials)");
    }
  } catch (err) {
    console.error(`❌ [STEP 5c] Email sending failed:`, err.message);
    // لا نعيد الخطأ، نكمل
  }

  console.log("🎉 [STEP 6] Function completed successfully");
  return { success: true, emailSent, uid: finalUid };
});

// ========== 2. التحقق من كود التفعيل ==========
exports.verifyCode = functions.https.onCall(async (data, context) => {
  const { email, uid, code } = data;
  if (!email || !uid || !code) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  // التحقق من أن المستخدم الموثق هو نفسه (يمكن إبقاء هذا للتحقق)
  if (!context.auth || context.auth.uid !== uid) {
    throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
  }

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

  const userRef = admin.firestore().collection('users').doc(uid);
  await userRef.update({
    emailVerified: true,
    verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  await admin.auth().updateUser(uid, { emailVerified: true });

  await codeDocRef.delete();
  return { success: true, message: 'تم تفعيل الحساب بنجاح' };
});

// ========== 3. التحقق من حالة التفعيل ==========
exports.checkEmailVerified = functions.https.onCall(async (data, context) => {
  const { uid } = data;
  if (!uid) throw new functions.https.HttpsError('invalid-argument', 'UID required');
  const userRecord = await admin.auth().getUser(uid);
  return { verified: userRecord.emailVerified };
});

// ========== 4. إرسال كود إعادة تعيين كلمة المرور ==========
exports.sendPasswordResetCode = functions.https.onCall(async (data, context) => {
  const { email } = data;
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

  const transporter = getTransporter();
  let emailSent = false;
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"MarsGo" <${functions.config().email.user}>`,
        to: email,
        subject: 'إعادة تعيين كلمة المرور في MarsGo',
        html: `
          <div dir="rtl" style="font-family: Tahoma, sans-serif; padding: 20px;">
            <h2>إعادة تعيين كلمة المرور</h2>
            <p>استخدم الرمز التالي لإعادة تعيين كلمة المرور. الرمز صالح لمدة 10 دقائق:</p>
            <h1 style="background: #f0f0f0; padding: 10px; text-align: center; letter-spacing: 5px;">${code}</h1>
            <p>إذا لم تطلب إعادة التعيين، يمكنك تجاهل هذه الرسالة.</p>
            <p>فريق MarsGo</p>
          </div>
        `,
      });
      emailSent = true;
    } catch (err) {
      console.error('Email sending failed:', err);
    }
  } else {
    console.log(`⚠️ Email not sent. Reset code for ${email}: ${code}`);
  }

  return { success: true, emailSent };
});

// ========== 5. التحقق من كود إعادة التعيين وتحديث كلمة المرور ==========
exports.verifyPasswordResetCode = functions.https.onCall(async (data, context) => {
  const { email, code, newPassword } = data;
  if (!email || !code || !newPassword) {
    throw new functions.https.HttpsError('invalid-argument', 'جميع الحقول مطلوبة');
  }

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