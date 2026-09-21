// Optional: adds 3 sample posts so you can see how Urdu / Arabic look.
// Run:  npm run seed      (delete the samples later from the admin panel)
require('../src/config');
const { initDb, pool } = require('../src/db');
const posts = require('../src/models/posts');
const { cleanContent, toPlainText, makeExcerpt, readingMinutes } = require('../src/utils/text');

const samples = [
  {
    title: 'سورۃ الفاتحہ کا تعارف',
    section: 'quran',
    lang: 'ur',
    content: `<h2>سورۃ الفاتحہ</h2>
<p>قرآنِ مجید کی پہلی سورت <strong>سورۃ الفاتحہ</strong> ہے۔ اسے اُمّ الکتاب بھی کہا جاتا ہے، کیونکہ اس میں پورے قرآن کے بنیادی مضامین سمیٹ دیے گئے ہیں۔</p>
<blockquote><p><span class="ql-font-arabic">الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ</span></p><p>تمام تعریف اللہ کے لیے ہے جو تمام جہانوں کا پالنے والا ہے۔</p></blockquote>
<h3>چند اہم نکات</h3>
<ul><li>اللہ کی حمد و ثنا</li><li>عبادت اور استعانت صرف اللہ کے لیے</li><li>صراطِ مستقیم کی دعا</li></ul>
<p>مزید مطالعے کے لیے <a href="https://quran.com/1">یہاں کلک کریں</a>۔</p>`,
  },
  {
    title: 'حدیث: اعمال کا دارومدار نیتوں پر ہے',
    section: 'hadith',
    lang: 'ur',
    content: `<p>صحیح بخاری کی پہلی حدیث نیت کی اہمیت پر ہے:</p>
<blockquote><p class="ql-align-center"><span class="ql-font-arabic">إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ</span></p></blockquote>
<p>یعنی اعمال کا دارومدار نیتوں پر ہے۔ اس حدیث کو علماء نے دین کے بنیادی اصولوں میں شمار کیا ہے۔</p>`,
  },
  {
    title: 'مقدمة في علم التفسير',
    section: 'quran',
    lang: 'ar',
    content: `<p>الحمد لله رب العالمين، والصلاة والسلام على أشرف الأنبياء والمرسلين. أما بعد، فإن علم التفسير من أجلّ العلوم وأشرفها؛ لأنه متعلق بكلام الله تعالى.</p>
<h2>أهمية التفسير</h2>
<p>قال الله تعالى: <span class="ql-font-arabic">أَفَلَا يَتَدَبَّرُونَ الْقُرْآنَ أَمْ عَلَىٰ قُلُوبٍ أَقْفَالُهَا</span></p>`,
  },
];

(async () => {
  await initDb();
  for (const s of samples) {
    const content = cleanContent(s.content);
    const plain = toPlainText(content);
    await posts.create({
      title: s.title, slug: '', section: s.section, lang: s.lang,
      excerpt: makeExcerpt(plain), content, cover_url: '', download_url: '',
      status: 'published', read_min: readingMinutes(plain),
    });
  }
  console.log(`Added ${samples.length} sample posts.`);
})()
  .catch((e) => { console.error(e.message); process.exitCode = 1; })
  .finally(() => pool.end());
