// The sections of your blog. They appear in the header, on the home page and in
// the admin "Section" drop-down.
//
// To rename a section: change `nav` / `title` / `desc`.
// To add a section: copy one block and give it a NEW unique `slug` (English letters, no spaces).
// IMPORTANT: never change the `slug` of a section that already has posts,
// otherwise those posts will lose their section.
module.exports = [
  {
    slug: 'quran',
    nav: 'قرآن',
    sub: 'Quran',
    title: 'قرآن',
    desc: 'آیاتِ قرآنی، تفسیر اور تدبر پر تحقیقی تحریریں',
    color: '#1F7A5A',
  },
  {
    slug: 'hadith',
    nav: 'حدیث',
    sub: 'Hadith',
    title: 'حدیث',
    desc: 'احادیث کی تحقیق، تخریج اور فہم',
    color: '#1D3F8C',
  },
  {
    slug: 'shia-sunni',
    nav: 'اختلافی مسائل',
    sub: 'Shia + Sunni',
    title: 'اختلافی مسائل (شیعہ + سنی)',
    desc: 'شیعہ اور سنی مکاتبِ فکر کے درمیان اختلافی مسائل پر علمی گفتگو',
    color: '#7A3B8C',
  },
  {
    slug: 'barelvi-deobandi-ahlehadith',
    nav: 'اختلافات',
    sub: 'Barelvi + Deobandi + Ahle Hadith',
    title: 'اختلافات (بریلوی + دیوبندی + اہلِ حدیث)',
    desc: 'بریلوی، دیوبندی اور اہلِ حدیث کے باہمی اختلافی مسائل',
    color: '#B5651D',
  },
  {
    slug: 'politicals',
    nav: 'سیاسیات',
    sub: 'Politicals',
    title: 'سیاسیات',
    desc: 'سیاسی و سماجی معاملات پر تجزیہ اور تحقیق',
    color: '#A33A3A',
  },
  {
    slug: 'my-books',
    nav: 'میری کتابیں',
    sub: 'My Books',
    title: 'میری کتابیں',
    desc: 'میری تصانیف اور تحقیقی کتب',
    color: '#2C7A8C',
  },
];
