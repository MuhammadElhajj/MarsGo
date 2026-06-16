// src/components/UserComponents/WhyChooseUs/WhyChooseUs.jsx
import {
  FiShield,
  FiHeadphones,
  FiDollarSign,
} from 'react-icons/fi';
import PaymentMethods from '../PaymentMethods/PaymentMethods';
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

  return (
    <div className="why-choose-us" dir="rtl">
      <h2 className="why-choose-us__title">لماذا نحن؟</h2>

      <div className="why-choose-us__features">
        {features.map((feature, index) => (
          <div key={index} className="why-choose-us__feature-card">
            <div className="why-choose-us__feature-header">
              <div className="why-choose-us__feature-icon">{feature.icon}</div>
              <h3 className="why-choose-us__feature-title">{feature.title}</h3>
            </div>
            <p className="why-choose-us__feature-description">{feature.description}</p>
          </div>
        ))}
      </div>

      <PaymentMethods />
    </div>
  );
}