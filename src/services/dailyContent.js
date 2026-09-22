const TIME_ZONE = 'Asia/Kolkata';

const QURAN_API = 'https://api.alquran.cloud/v1/ayah';

// Arabic Quran edition
const QURAN_ARABIC_EDITION = 'quran-uthmani';

// Urdu Quran translation
const QURAN_URDU_EDITION = 'ur.jalandhry';

// Hadith API
const HADITH_API =
  'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';


let cache = {
  key: null,
  data: null,
};


/**
 * Get current date in India
 * Format: YYYY-MM-DD
 */
function getIndiaDateKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}


/**
 * Urdu/Gregorian date
 */
function getUrduDate() {
  return new Intl.DateTimeFormat('ur-PK', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
}


/**
 * Hijri date
 */
function getHijriDate() {
  return new Intl.DateTimeFormat(
    'ur-PK-u-ca-islamic-umalqura',
    {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  ).format(new Date());
}


/**
 * Calculate day of year
 */
function dayOfYear(dateKey) {
  const [year, month, day] = dateKey
    .split('-')
    .map(Number);

  const start = new Date(Date.UTC(year, 0, 1));
  const current = new Date(
    Date.UTC(year, month - 1, day)
  );

  return (
    Math.floor(
      (current - start) / 86400000
    ) + 1
  );
}


/**
 * Generic JSON fetcher
 */
async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Request failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}


/**
 * Get daily Quran ayah
 */
async function getQuran(day) {

  /*
   * Quran contains 6236 ayahs.
   *
   * This rotates through the complete Quran
   * according to the day of the year.
   */
  const ayahNumber =
    ((day - 1) % 6236) + 1;


  try {

    /*
     * Fetch Arabic + Urdu simultaneously.
     *
     * Al Quran Cloud supports edition-based
     * requests for translations.
     */
    const [
      arabicData,
      urduData,
    ] = await Promise.all([

      fetchJson(
        `${QURAN_API}/${ayahNumber}/${QURAN_ARABIC_EDITION}`
      ),

      fetchJson(
        `${QURAN_API}/${ayahNumber}/${QURAN_URDU_EDITION}`
      ),

    ]);


    if (!arabicData || !arabicData.data) {
      throw new Error(
        'Arabic Quran data unavailable'
      );
    }


    if (!urduData || !urduData.data) {
      throw new Error(
        'Urdu Quran data unavailable'
      );
    }


    const arabic = arabicData.data;
    const urdu = urduData.data;


    return {

      arabic: arabic.text,

      urdu: urdu.text,

      surah:
        arabic.surah?.name || '',

      surahEnglish:
        arabic.surah?.englishName || '',

      surahNumber:
        arabic.surah?.number || null,

      ayahNumber:
        arabic.numberInSurah,

      globalNumber:
        arabic.number,

      reference:
        `${arabic.surah?.name || ''} — ${arabic.numberInSurah}`,

    };

  } catch (error) {

    console.error(
      'Quran API error:',
      error.message
    );


    /*
     * Fallback content.
     * The site will still show something
     * if the external API is temporarily unavailable.
     */
    return {

      arabic:
        'إِنَّ مَعَ الْعُسْرِ يُسْرًا',

      urdu:
        'بے شک مشکل کے ساتھ آسانی ہے۔',

      surah:
        'الشرح',

      surahEnglish:
        'Ash-Sharh',

      surahNumber:
        94,

      ayahNumber:
        6,

      globalNumber:
        null,

      reference:
        'سورۃ الشرح — 94:6',

    };

  }
}


/**
 * Get daily Hadith
 */
async function getHadith(day) {

  /*
   * Bukhari contains thousands of hadith.
   *
   * We use the number available in the API
   * and rotate based on the day.
   */
  const hadithNumber =
    ((day - 1) % 7563) + 1;


  try {

    /*
     * Fetch Arabic and Urdu Bukhari
     * independently.
     */
    const [
      arabicData,
      urduData,
    ] = await Promise.all([

      fetchJson(
        `${HADITH_API}/ara-bukhari/${hadithNumber}.json`
      ),

      fetchJson(
        `${HADITH_API}/urd-bukhari/${hadithNumber}.json`
      ),

    ]);


    const arabicHadith =
      arabicData?.hadiths?.[0];

    const urduHadith =
      urduData?.hadiths?.[0];


    if (!arabicHadith) {
      throw new Error(
        'Arabic Hadith unavailable'
      );
    }


    return {

      arabic:
        arabicHadith.text || '',

      urdu:
        urduHadith?.text || '',

      number:
        arabicHadith.hadithnumber ||
        hadithNumber,

      collection:
        'صحیح البخاری',

      reference:
        `صحیح البخاری — حدیث ${arabicHadith.hadithnumber || hadithNumber}`,

    };

  } catch (error) {

    console.error(
      'Hadith API error:',
      error.message
    );


    /*
     * Fallback Hadith
     */
    return {

      arabic:
        'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',

      urdu:
        'اعمال کا دار و مدار نیتوں پر ہے، اور ہر شخص کو وہی ملے گا جس کی اس نے نیت کی۔',

      number:
        1,

      collection:
        'صحیح البخاری',

      reference:
        'صحیح البخاری — حدیث 1',

    };

  }
}


/**
 * Get everything for today
 */
async function getToday() {

  const key =
    getIndiaDateKey();


  /*
   * Don't request APIs repeatedly
   * during the same day.
   */
  if (
    cache.key === key &&
    cache.data
  ) {
    return cache.data;
  }


  const day =
    dayOfYear(key);


  const [
    ayah,
    hadith,
  ] = await Promise.all([

    getQuran(day),

    getHadith(day),

  ]);


  const data = {

    dateKey:
      key,

    date:
      getUrduDate(),

    hijri:
      getHijriDate(),

    ayah,

    hadith,

  };


  cache = {

    key,

    data,

  };


  return data;
}


module.exports = {
  getToday,
};