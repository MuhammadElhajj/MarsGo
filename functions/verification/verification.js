
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// تعريف الأسرار
const emailUserSecret = defineSecret('EMAIL_USER');
const emailPassSecret = defineSecret('EMAIL_PASS');

// ========== دوال مساعدة ==========
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

let transporter = null;
function getTransporter(emailUser, emailPass) {
  if (transporter) return transporter;
  try {
    if (!emailUser || !emailPass) {
      console.warn('⚠️ Email credentials missing');
      return null;
    }
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPass },
    });
    return transporter;
  } catch (err) {
    console.error('❌ Error creating email transporter:', err.message);
    return null;
  }
}

// ========== 1. إرسال كود التفعيل ==========
exports.sendVerificationCode = onCall(
  { secrets: [emailUserSecret, emailPassSecret], cors: true },
  async (request) => {
    const data = request.data;
    let email = data?.email || data?.data?.email;
    let uid = data?.uid || data?.data?.uid;

    if (!email) {
      throw new HttpsError('invalid-argument', 'البريد الإلكتروني مطلوب');
    }

    let finalUid = uid;
    if (!finalUid) {
      try {
        const userRecord = await admin.auth().getUserByEmail(email);
        finalUid = userRecord.uid;
      } catch (err) {
        throw new HttpsError('not-found', 'لا يوجد مستخدم بهذا البريد');
      }
    }

    // التحقق من وجود المستخدم
    try {
      const userRecord = await admin.auth().getUser(finalUid);
      if (userRecord.email !== email) throw new Error('Email mismatch');
    } catch (err) {
      throw new HttpsError('not-found', 'بيانات المستخدم غير صحيحة');
    }

    // منع التكرار (مرة كل دقيقة)
    const codeDocRef = admin.firestore().collection('verificationCodes').doc(finalUid);
    const codeSnap = await codeDocRef.get();
    const now = Date.now();

    if (codeSnap.exists) {
      const lastSent = codeSnap.data().lastSentAt?.toMillis?.() || 0;
      if (now - lastSent < 60000) {
        throw new HttpsError('failed-precondition', 'الرجاء الانتظار دقيقة قبل طلب كود جديد');
      }
    }

    const code = generateVerificationCode();
    const expiresAt = admin.firestore.Timestamp.fromMillis(now + 10 * 60 * 1000);

    await codeDocRef.set(
      {
        code,
        email,
        expiresAt,
        lastSentAt: admin.firestore.FieldValue.serverTimestamp(),
        attempts: 0,
      },
      { merge: true }
    );

    // إرسال البريد الإلكتروني
    const emailUser = emailUserSecret.value();
    const emailPass = emailPassSecret.value();
    const transporter = getTransporter(emailUser, emailPass);
    let emailSent = false;

    try {
      if (transporter) {
        await transporter.sendMail({
          from: `"MarsGo" <${emailUser}>`,
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
      }
    } catch (err) {
      console.error(' Email sending failed:', err.message);
    }

    return { success: true, emailSent, uid: finalUid };
  }
);

// ========== 2. التحقق من كود التفعيل (مع دعم الاسم) ==========
exports.verifyCode = onCall({ cors: true }, async (request) => {
  const data = request.data;
  const email = data?.email || data?.data?.email;
  const uid = data?.uid || data?.data?.uid;
  const code = data?.code || data?.data?.code;
  const name = data?.name || data?.data?.name; // استقبال الاسم (اختياري)

  if (!email) throw new HttpsError('invalid-argument', 'البريد الإلكتروني مطلوب');
  if (!uid) throw new HttpsError('invalid-argument', 'معرف المستخدم (UID) مطلوب');
  if (!code) throw new HttpsError('invalid-argument', 'رمز التفعيل مطلوب');

  // تعريف codeDocRef هنا
  const codeDocRef = admin.firestore().collection('verificationCodes').doc(uid);
  const codeSnap = await codeDocRef.get();

  if (!codeSnap.exists) {
    throw new HttpsError('not-found', 'لم يتم طلب كود تفعيل لهذا الحساب');
  }

  const record = codeSnap.data();
  if (record.email !== email) {
    throw new HttpsError('permission-denied', 'البريد الإلكتروني غير متطابق');
  }
  if (record.expiresAt?.toMillis?.() < Date.now()) {
    await codeDocRef.delete();
    throw new HttpsError('deadline-exceeded', 'انتهت صلاحية الكود. يرجى طلب كود جديد');
  }

  const attempts = (record.attempts || 0) + 1;
  if (attempts > 3) {
    await codeDocRef.delete();
    throw new HttpsError('failed-precondition', 'تم تجاوز عدد المحاولات. يرجى طلب كود جديد');
  }
  if (record.code !== code) {
    await codeDocRef.update({ attempts });
    throw new HttpsError('invalid-argument', 'الكود غير صحيح');
  }

  // تفعيل حساب Firebase Auth
  try {
    await admin.auth().updateUser(uid, { disabled: false, emailVerified: true });
  } catch (authErr) {
    console.error('⚠️ Auth update failed:', authErr.message);
    throw new HttpsError('internal', 'فشل تحديث حالة الحساب');
  }

  // إنشاء/تحديث وثيقة المستخدم في Firestore
  const userRef = admin.firestore().collection('users').doc(uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    // إذا كانت الوثيقة غير موجودة، ننشئها بالاسم المرسل
    const finalName = name && name.trim() ? name.trim() : 'مستخدم';
    await userRef.set({
      email: email,
      name: finalName,
      emailVerified: true,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      balance: 0,
      mgcBalance: 0,
      role: 'customer',
    });
  } else {
    // إذا كانت موجودة، نحدّث فقط الحقول الضرورية
    await userRef.update({
      emailVerified: true,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    // (اختياري) إذا كان الاسم فارغاً في الوثيقة، يمكن تحديثه
    if (!userSnap.data().name && name) {
      await userRef.update({ name: name.trim() });
    }
  }

  // حذف كود التفعيل بعد الاستخدام
  await codeDocRef.delete();

  return { success: true, message: 'تم تفعيل حسابك بنجاح! يمكنك الآن تسجيل الدخول.' };
});

// ========== 3. تعطيل حساب المستخدم (محمي + تسجيل تدقيق) ==========
exports.disableUser = onCall({ cors: true }, async (request) => {
  // التحقق من المصادقة
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'يجب تسجيل الدخول');
  }

  const { uid } = request.data;
  if (!uid) {
    throw new HttpsError('invalid-argument', 'UID مطلوب');
  }

  // منع المستخدم من تعطيل نفسه
  if (request.auth.uid === uid) {
    throw new HttpsError('invalid-argument', 'لا يمكنك تعطيل حسابك بنفسك');
  }

  // ✅ التحقق من أن المستخدم الحالي هو مدير
  const adminUserRef = admin.firestore().collection('users').doc(request.auth.uid);
  const adminUserSnap = await adminUserRef.get();
  if (!adminUserSnap.exists || adminUserSnap.data().role !== 'admin') {
    throw new HttpsError('permission-denied', 'ليس لديك صلاحية لتعطيل حسابات المستخدمين');
  }

  // ✅ التأكد من وجود المستخدم المستهدف (اختياري ولكن مفيد)
  const targetUserRef = admin.firestore().collection('users').doc(uid);
  const targetUserSnap = await targetUserRef.get();
  if (!targetUserSnap.exists) {
    throw new HttpsError('not-found', 'المستخدم المستهدف غير موجود');
  }

  try {
    // تعطيل الحساب في Firebase Auth
    await admin.auth().updateUser(uid, { disabled: true });

    // ✅ تسجيل العملية في سجل التدقيق
    await admin.firestore().collection('auditLogs').add({
      action: 'disableUser',
      adminId: request.auth.uid,
      targetUserId: uid,
      targetUserEmail: targetUserSnap.data().email || 'unknown',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, message: 'تم تعطيل الحساب بنجاح' };
  } catch (error) {
    console.error('❌ Disable user failed:', error.message);
    throw new HttpsError('internal', 'فشل تعطيل الحساب');
  }
});

// ========== 4. التحقق من حالة التفعيل ==========
exports.checkEmailVerified = onCall({ cors: true }, async (request) => {
  let uid = request.data?.uid || request.data?.data?.uid;
  if (!uid) {
    throw new HttpsError('invalid-argument', 'UID مطلوب');
  }
  if (!request.auth || request.auth.uid !== uid) {
    throw new HttpsError('permission-denied', 'غير مصرح');
  }
  const userRecord = await admin.auth().getUser(uid);
  return { verified: userRecord.emailVerified };
});

// ========== 5. إرسال كود إعادة تعيين كلمة المرور ==========
exports.sendPasswordResetCode = onCall(
  { secrets: [emailUserSecret, emailPassSecret], cors: true },
  async (request) => {
    const data = request.data;
    let email = data?.email || data?.data?.email;

    if (!email) {
      throw new HttpsError('invalid-argument', 'البريد الإلكتروني مطلوب');
    }

    let uid;
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      uid = userRecord.uid;
    } catch (err) {
      // أمن: لا نكشف إذا كان الإيميل موجوداً أم لا
      return { success: true, message: 'إذا كان البريد موجوداً، تم إرسال الكود.' };
    }

    const codeDocRef = admin.firestore().collection('passwordResets').doc(uid);
    const codeSnap = await codeDocRef.get();
    const now = Date.now();
    if (codeSnap.exists) {
      const lastSent = codeSnap.data().lastSentAt?.toMillis?.() || 0;
      if (now - lastSent < 60000) {
        throw new HttpsError('failed-precondition', 'الرجاء الانتظار دقيقة قبل طلب كود جديد');
      }
    }

    const code = generateVerificationCode();
    const expiresAt = admin.firestore.Timestamp.fromMillis(now + 10 * 60 * 1000);

    await codeDocRef.set(
      {
        code,
        email,
        expiresAt,
        lastSentAt: admin.firestore.FieldValue.serverTimestamp(),
        attempts: 0,
      },
      { merge: true }
    );

    const emailUser = emailUserSecret.value();
    const emailPass = emailPassSecret.value();
    const transporter = getTransporter(emailUser, emailPass);
    let emailSent = false;

    try {
      if (transporter) {
        await transporter.sendMail({
          from: `"MarsGo" <${emailUser}>`,
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
      }
    } catch (err) {
      console.error('Email sending failed:', err);
    }

    return { success: true, emailSent };
  }
);

// ========== 6. التحقق من كود إعادة التعيين ==========
exports.verifyPasswordResetCode = onCall({ cors: true }, async (request) => {
  const data = request.data;
  let email = data?.email || data?.data?.email;
  let code = data?.code || data?.data?.code;
  let newPassword = data?.newPassword || data?.data?.newPassword;

  if (!email) throw new HttpsError('invalid-argument', 'البريد الإلكتروني مطلوب');
  if (!code) throw new HttpsError('invalid-argument', 'رمز التحقق مطلوب');
  if (!newPassword) throw new HttpsError('invalid-argument', 'كلمة المرور الجديدة مطلوبة');
  if (newPassword.length < 6) {
    throw new HttpsError('invalid-argument', 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
  }

  let uid;
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    uid = userRecord.uid;
  } catch (err) {
    throw new HttpsError('not-found', 'لا يوجد حساب مرتبط بهذا البريد');
  }

  const codeDocRef = admin.firestore().collection('passwordResets').doc(uid);
  const codeSnap = await codeDocRef.get();

  if (!codeSnap.exists) {
    throw new HttpsError('not-found', 'لم يتم طلب كود إعادة تعيين لهذا الحساب');
  }

  const record = codeSnap.data();
  if (record.expiresAt?.toMillis?.() < Date.now()) {
    await codeDocRef.delete();
    throw new HttpsError('deadline-exceeded', 'انتهت صلاحية الكود. يرجى طلب كود جديد');
  }

  const attempts = (record.attempts || 0) + 1;
  if (attempts > 3) {
    await codeDocRef.delete();
    throw new HttpsError('failed-precondition', 'تم تجاوز عدد المحاولات. يرجى طلب كود جديد');
  }
  if (record.code !== code) {
    await codeDocRef.update({ attempts });
    throw new HttpsError('invalid-argument', 'الكود غير صحيح');
  }

  await admin.auth().updateUser(uid, { password: newPassword });
  await codeDocRef.delete();

  return { success: true, message: 'تم تغيير كلمة المرور بنجاح' };
});



// ... (الدوال المساعدة generateVerificationCode, getTransporter كما هي)
const { onRequest } = require('firebase-functions/v2/https');
const cors = require('cors')({ origin: true });

/**
 * دالة جديدة لإرسال كود تأكيد الرقم السري (مع CORS يدوي)
 * الاسم: sendSecretVerificationCodeV2
 */
exports.sendSecretVerificationCodeV2 = onRequest(
  { secrets: [emailUserSecret, emailPassSecret] },
  async (req, res) => {
    cors(req, res, async () => {
      try {
        console.log('🚀 sendSecretVerificationCodeV2 started');

        const data = req.body.data || req.body;
        const email = data?.email;
        const uid = data?.uid;

        if (!email) {
          return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });
        }

        let finalUid = uid;
        if (!finalUid) {
          try {
            const userRecord = await admin.auth().getUserByEmail(email);
            finalUid = userRecord.uid;
          } catch (err) {
            return res.status(404).json({ error: 'لا يوجد مستخدم بهذا البريد' });
          }
        }

        // التحقق من وجود المستخدم
        try {
          const userRecord = await admin.auth().getUser(finalUid);
          if (userRecord.email !== email) throw new Error('Email mismatch');
        } catch (err) {
          return res.status(404).json({ error: 'بيانات المستخدم غير صحيحة' });
        }

        // منع التكرار
        const codeDocRef = admin.firestore().collection('verificationCodes').doc(finalUid);
        const codeSnap = await codeDocRef.get();
        const now = Date.now();

        if (codeSnap.exists) {
          const lastSent = codeSnap.data().lastSentAt?.toMillis?.() || 0;
          if (now - lastSent < 60000) {
            return res.status(429).json({ error: 'الرجاء الانتظار دقيقة قبل طلب كود جديد' });
          }
        }

        const code = generateVerificationCode();
        const expiresAt = admin.firestore.Timestamp.fromMillis(now + 10 * 60 * 1000);

        await codeDocRef.set(
          {
            code,
            email,
            expiresAt,
            lastSentAt: admin.firestore.FieldValue.serverTimestamp(),
            attempts: 0,
            purpose: 'show_secret',
          },
          { merge: true }
        );

        // إرسال البريد الإلكتروني
        const emailUser = emailUserSecret.value();
        const emailPass = emailPassSecret.value();
        const transporter = getTransporter(emailUser, emailPass);
        let emailSent = false;

        if (transporter) {
          try {
            await transporter.sendMail({
              from: `"MarsGo" <${emailUser}>`,
              to: email,
              subject: ' كود تأكيد لعرض الرقم السري - MarsGo',
              html: `
  <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; direction: rtl; text-align: right; padding: 20px; background-color: #f9f9f9;">
    <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <h2 style="color: #4f46e5;"> طلب عرض الرقم السري</h2>
      <p>لقد طلبت عرض الرقم السري لبطاقتك في MarsGo. استخدم الكود التالي لتأكيد هويتك:</p>
      <div style="background: #f0f0f0; font-size: 28px; font-weight: bold; text-align: center; padding: 15px; margin: 20px 0; letter-spacing: 8px; border-radius: 8px; direction: ltr;">
        ${code}
      </div>
      <p><strong>ملاحظة:</strong> هذا الكود صالح لمدة 10 دقائق وللاستخدام مرة واحدة فقط.</p>
      <p>إذا لم تقم بطلب هذا الكود، يرجى تجاهل هذه الرسالة وتأمين حسابك فوراً.</p>
      <hr style="margin: 20px 0;">
      <p style="font-size: 12px; color: #aaa;">هذه رسالة آلية من MarsGo – لا ترد على هذا البريد.</p>
    </div>
  </div>
`, // نفس المحتوى السابق
            });
            emailSent = true;
          } catch (err) {
            console.error('❌ Email error:', err.message);
          }
        }

        return res.status(200).json({ success: true, emailSent, uid: finalUid });

      } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ error: error.message });
      }
    });
  }
);