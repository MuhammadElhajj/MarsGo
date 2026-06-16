// src/components/UserComponents/WhyChooseUs/WhyChooseUs.jsx
import {
  FiShield,
  FiHeadphones,
  FiDollarSign,
  FiLock,
  FiCreditCard,
} from 'react-icons/fi';
import {
  FaPaypal,
  FaGooglePay,
  FaCcMastercard,
  FaCcVisa,
} from 'react-icons/fa';
import { SiKlarna } from 'react-icons/si';
import './WhyChooseUs.css';

export default function WhyChooseUs() {
  const features = [
    {
      icon: <FiShield />,
      title: 'معاملات آمنة 100%',
      description: 'نضمن معاملات فعالة واحترافية وآمنة مع حماية كاملة لبياناتك – آمنة 100%.',
    },
    {
      icon: <FiHeadphones />,
      title: 'دعم فني على مدار الساعة',
      description: 'فريق دعم موثوق متاح في أي وقت، يقدم مساعدة سريعة ومريحة قبل وأثناء وبعد عملية الشراء.',
    },
    {
      icon: <FiDollarSign />,
      title: 'ضمان استرداد كامل',
      description: 'نقدم أسعاراً تنافسية وتوصيلاً فعالاً. إذا لم يتم تسليم المنتج أو لم يكن قابلاً للاستخدام، نعدك باسترداد كامل وأمان مالي.',
    },
  ];

  const paymentMethods = [
    { name: 'PayPal', icon: <FaPaypal /> },
    { name: 'Google Pay', icon: <FaGooglePay /> },
    { name: 'Klarna', icon: <SiKlarna /> },
    { name: 'paysafecard', icon: <FiCreditCard /> },
    { name: 'MasterCard', icon: <FaCcMastercard /> },
    { name: 'Visa', icon: <FaCcVisa /> },
    { name: 'SecureCode', icon: <FiLock /> },
  ];

  return (
    <div className="why-choose-us" dir="rtl">
      <h2 className="why-choose-us__title">لماذا نحن؟</h2>

      <div className="why-choose-us__features">
        {features.map((feature, index) => (
          <div key={index} className="why-choose-us__feature-card">
            <div className="why-choose-us__feature-icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="why-choose-us__payment-section">
        <h4>  طرق الدفع المقبولة قريبا</h4>
        <div className="why-choose-us__payment-marquee">
          <div className="why-choose-us__payment-track">
            {paymentMethods.concat(paymentMethods).map((method, index) => (
              <span key={index} className="payment-icon">
                {method.icon}
                <span className="payment-name">{method.name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}