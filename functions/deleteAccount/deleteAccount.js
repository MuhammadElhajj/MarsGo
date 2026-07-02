// functions/deleteAccount/deleteAccount.js
const { onCall, HttpsError, onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const cors = require('cors')({ origin: true });

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
      console.warn('Email credentials missing');
      return null;
    }
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPass },
    });
    return transporter;
  } catch (err) {
    console.error('Error creating email transporter:', err.message);
    return null;
  }
}

// ============================================================
// 1. إرسال كود التحقق لحذف الحساب (onCall)
// ============================================================
exports.sendDeleteVerificationCode = onCall(
  { secrets: [emailUserSecret, emailPassSecret], cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'يجب تسجيل الدخول');
    }

    const uid = request.auth.uid;
    const email = request.auth.token.email;

    if (!email) {
      throw new HttpsError('invalid-argument', 'البريد الإلكتروني غير متاح');
    }

    const userRef = admin.firestore().collection('users').doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'المستخدم غير موجود');
    }

    const userData = userSnap.data();
    if (userData.role === 'admin') {
      throw new HttpsError('permission-denied', 'لا يمكن حذف حساب المدير');
    }

    const codeDocRef = admin.firestore().collection('deleteVerificationCodes').doc(uid);
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
          subject: 'رمز تأكيد حذف حساب MarsGo',
          html: `
            <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; direction: rtl; text-align: right; padding: 20px; background-color: #f9f9f9;">
              <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #ef4444;">طلب حذف الحساب</h2>
                <p>لقد طلبت حذف حسابك في MarsGo. استخدم الكود التالي لتأكيد العملية:</p>
                <div style="background: #f0f0f0; font-size: 28px; font-weight: bold; text-align: center; padding: 15px; margin: 20px 0; letter-spacing: 8px; border-radius: 8px; direction: ltr;">
                  ${code}
                </div>
                <p><strong>ملاحظة:</strong> هذا الكود صالح لمدة 10 دقائق.</p>
                <p>إذا لم تقم بطلب حذف الحساب، يرجى تجاهل هذه الرسالة وتأمين حسابك فوراً.</p>
                <hr style="margin: 20px 0;">
                <p style="font-size: 12px; color: #aaa;">هذه رسالة آلية من MarsGo – لا ترد على هذا البريد.</p>
              </div>
            </div>
          `,
        });
        emailSent = true;
        console.log(`Delete verification email sent to ${email} with code ${code}`);
      } else {
        console.warn('No transporter available for delete email');
      }
    } catch (err) {
      console.error('Email sending failed:', err.message);
      throw new HttpsError('internal', 'فشل إرسال كود التحقق');
    }

    return {
      success: true,
      emailSent,
      message: 'تم إرسال كود التحقق إلى بريدك الإلكتروني',
    };
  }
);

// ============================================================
// 2. التحقق من الكود وحذف الحساب (onRequest مع CORS يدوي)
// ============================================================
exports.verifyAndDeleteAccount = onRequest(
  { secrets: [emailUserSecret, emailPassSecret] },
  async (req, res) => {
    cors(req, res, async () => {
      try {
        // التحقق من التوكن
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'غير مصرح: التوكن مطلوب' });
        }
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const { code } = req.body;
        if (!code) {
          return res.status(400).json({ error: 'كود التحقق مطلوب' });
        }

        // جلب الكود من Firestore
        const codeDocRef = admin.firestore().collection('deleteVerificationCodes').doc(uid);
        const codeSnap = await codeDocRef.get();
        if (!codeSnap.exists) {
          return res.status(404).json({ error: 'لم يتم طلب كود حذف للحساب' });
        }

        const record = codeSnap.data();

        // التحقق من صحة البريد
        const userRecord = await admin.auth().getUser(uid);
        if (record.email !== userRecord.email) {
          return res.status(403).json({ error: 'البريد الإلكتروني غير متطابق' });
        }

        // التحقق من صلاحية الكود
        if (record.expiresAt?.toMillis?.() < Date.now()) {
          await codeDocRef.delete();
          return res.status(410).json({ error: 'انتهت صلاحية الكود. يرجى طلب كود جديد' });
        }

        // التحقق من عدد المحاولات
        const attempts = (record.attempts || 0) + 1;
        if (attempts > 3) {
          await codeDocRef.delete();
          return res.status(429).json({ error: 'تم تجاوز عدد المحاولات. يرجى طلب كود جديد' });
        }

        // التحقق من صحة الكود
        if (record.code !== code) {
          await codeDocRef.update({ attempts });
          return res.status(400).json({ error: 'الكود غير صحيح' });
        }

        // الكود صحيح – نقوم بحذف الحساب
        // 1. حذف الكود
        await codeDocRef.delete();

        // 2. حذف وثيقة المستخدم
        await admin.firestore().collection('users').doc(uid).delete();

        // 3. حذف البيانات المرتبطة (إشعارات، طلبات، إلخ)
        const collections = ['notifications', 'topUpRequests', 'orders', 'friendRequests', 'referral_rewards'];
        for (const col of collections) {
          try {
            const snap = await admin.firestore().collection(col).where('userId', '==', uid).get();
            const batch = admin.firestore().batch();
            snap.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
          } catch (err) {
            console.warn(`Failed to delete ${col}:`, err.message);
          }
        }

        // حذف طلبات الصداقة (حقول من/إلى)
        try {
          const f1 = await admin.firestore().collection('friendRequests').where('from', '==', uid).get();
          const f2 = await admin.firestore().collection('friendRequests').where('to', '==', uid).get();
          const batch = admin.firestore().batch();
          f1.docs.forEach(doc => batch.delete(doc.ref));
          f2.docs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        } catch (err) {
          console.warn('Failed to delete friend requests:', err.message);
        }

        // حذف سجل الإحالات (حقول referrerId/referredId)
        try {
          const rr1 = await admin.firestore().collection('referral_rewards').where('referrerId', '==', uid).get();
          const rr2 = await admin.firestore().collection('referral_rewards').where('referredId', '==', uid).get();
          const batch = admin.firestore().batch();
          rr1.docs.forEach(doc => batch.delete(doc.ref));
          rr2.docs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        } catch (err) {
          console.warn('Failed to delete referral rewards:', err.message);
        }

        // حذف حساب Firebase Auth
        await admin.auth().deleteUser(uid);

        // تسجيل في سجل التدقيق
        await admin.firestore().collection('auditLogs').add({
          action: 'deleteAccount',
          userId: uid,
          userEmail: userRecord.email,
          deletedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return res.status(200).json({ success: true, message: 'تم حذف حسابك بنجاح' });

      } catch (error) {
        console.error('Delete account error:', error);
        return res.status(500).json({ error: error.message || 'حدث خطأ أثناء حذف الحساب' });
      }
    });
  }
);